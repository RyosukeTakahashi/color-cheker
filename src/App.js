import React, {Component} from 'react';
import './App.css';
//Material UI
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormGroup from '@material-ui/core/FormGroup/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import Checkbox from '@material-ui/core/Checkbox/Checkbox';
//imported libraries
import styled from 'styled-components';
import axios from 'axios';
import firebase from 'firebase/app';
import 'firebase/firestore';
import {firebaseConfig} from './firebase/config.js';
import panAndZoomHoc from 'react-pan-and-zoom-hoc';
import Papa from 'papaparse';
import {Row, Col} from 'react-flexbox-grid';
//hand made component
import Squares from './Squares';
import {StyledQuestionNumberText} from './QuestionNumberText';
import {StyledCorrectOrWrong} from './CorrectOrWrong';
import {AnswerGrid} from './AnswerGrid';
import {MachineCheckResultTable} from './MachineCheckResultTable';

//constants settings
export const firebaseApp = firebase.initializeApp(firebaseConfig);
export const db = firebaseApp.firestore();
// const settings = {timestampsInSnapshots: true};
// db.settings(settings);
const gridLength = 5;
const DataCollectionModeStr = 'DataCollection';
const AnsweringModeStr = 'Answering';

//--done 正解表示UIを作成
//--done モード選択を用意。
//--done(問題ID,正解) correct_answers.csv用意
//--done 良品/不良判断ボタンを用意。
//--done 解答時間を計測する。
//--done 次行くときにデータを送信する
//--done 初期化
//--done 画像拡大機能
//--done欠点の種類を選べるようにする

//納品までにすること
//-pending 画像を用意する
//-pending 画像を出す順番仕様策定
//
// 4k加増度 分解能 0.125
//最初に人が見て基準画像
//次のやつが検査装置的にOKなら、基準画像が更新される。（学習方式という）
//更新され続けたら、最後と大きな違いが生まれている可能性はある。
//色差 デルタ256bit, 面積を見ている。2点に飛んだら、それをくくるスクエアを置いている。
//欠点が検出されたら、欠点画像表示→保存→一応紙で印刷。
//検出レベルを高くすると、警報がなりっぱなし。セブンだったらこのレベルで良いみたいのはあったらいい。

//欠点の種類
//スジ飛び（ドクターブレードの劣化による）、フィッシュアイ（異物あるところに、インク付着しない）
//インラインとオフラインの検査装置がある。

const defectTypes = ['suji', 'fishEye', 'hoge', 'other'];
const paneNames = ['leftPane', 'centerPane', 'rightPane'];
const paneWidth = ['230px', '1fr', '350px'];
const appLayoutGridTemplate = `
"${paneNames.join(' ')}"
/ ${paneWidth.join(' ')}
`;

const AppLayoutGrid = styled.div`
  display: grid;
  grid-template: ${appLayoutGridTemplate};
`;

const Pane = styled.div`
  grid-area: ${props => props.area};
`;

const LeftPane = styled(Pane)`
  border-right-width: medium;
  border-right-style: solid;
  margin-right: 40px;
  padding-right: 15px;
`;

const PannableAndZoomableHOC = panAndZoomHoc('div');

let id = 0;

function createData(defectArea, defectRank) {
  id += 1;
  return {id, defectArea, defectRank};
}

const initialPosition = {
  x: 0.5,
  y: 0.5,
  scale: 1,
};

const initializedStateOnButtonClicked = Object.assign({
  clickedAreas: [],
  defectReason: '',
  timeUsed: 0,
  startTimestamp: new Date(),
  shownView: 'Question',
}, initialPosition);

const appState = Object.assign({
  subjectId: 'hoge',
  nthQuestion: 1,
  selectedMode: 'DataCollection',
  data: {},
  machineCheckResult: [],
  imageWidth: 600,
  imageHeight: 600,
}, initializedStateOnButtonClicked);

defectTypes.forEach((defectType) => {
  appState[defectType] = false;
});

class App extends Component {

  state = appState;

  componentDidMount() {
    this.startTimer();
    if (this.state.selectedMode === DataCollectionModeStr) {
      App.getAnswer().then(data => {
        console.log('got data from json');
        this.setState({data});
      }).catch(err => {
        console.log(err);
      });
    }

    App.getCsv().then(csv => {
      console.log('got data from csv');
      this.setState({machineCheckResult: Papa.parse(csv)['data']});
    }).catch(err => {
      console.log(err);
    });
  }

  static async getAnswer() {
    const res = await axios('./correct_answers.json');
    return await res.data;
  };

  static async getCsv() {
    const res = await axios('./sample_dropped.csv');
    return await res.data;
  };

  handleAreaClick = (gridCount) => () => {

    const clickedAreas = () => {
      if (!this.state.clickedAreas.includes(gridCount)) {
        return this.state.clickedAreas.concat([gridCount]);
      } else {
        return this.state.clickedAreas.filter(
          (element) => element !== gridCount);
      }
    };
    this.setState({
        clickedAreas: clickedAreas(),
      },
    );
  };

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  handleNextButtonClick = () => {
    this.stopTimer();
    // noinspection ES6ShorthandObjectProperty
    const {data, machineCheckResult, ...stateWOanswerData} = this.state; // deletes data from state non-destructively
    db.collection('answers').add(stateWOanswerData).then(docRef => {
      console.log('Document written with ID: ', docRef.id);
    }).catch(error => {
      console.error('Error adding document: ', error);
    });

    if (this.state.selectedMode === DataCollectionModeStr) {
      this.initializeForNextQuestion();
      this.startTimer();
    } else {
      this.setState({
        shownView: 'Answer',
      });
    }

  };

  handlePanAndZoom(x, y, scale) {
    this.setState({x, y, scale});
  }

  handlePanMove(x, y) {
    this.setState({x, y});
  }

  handleInitializePosition = () => {
    this.setState(initialPosition);
  };

  initializeForNextQuestion() {
    this.setState(prevState => {
      defectTypes.forEach((defectType) => {
        initializedStateOnButtonClicked[defectType] = false;
      });
      initializedStateOnButtonClicked['nthQuestion'] = prevState.nthQuestion +
        1;

      return initializedStateOnButtonClicked;
    });
  }

  startTimer = () => {
    clearInterval(this.timer);
    this.timer = setInterval(this.tick, 1000);
  };

  stopTimer = () => {
    clearInterval(this.timer);
  };

  tick = () => {
    this.setState(prevState => {
      return {timeUsed: prevState.timeUsed + 1};
    });
  };

  handleRadioButtonChange = event => {
    this.setState({selectedMode: event.target.value});
  };
  handleCheckboxChange = name => event => {
    this.setState({[name]: event.target.checked});
  };

  handleNextButtonClickInAnswerView = () => {
    this.initializeForNextQuestion();
    this.startTimer();
  };

  render() {

    const {
      clickedAreas,
      nthQuestion,
      // defectReason,
      x,
      y,
      scale,
      imageWidth,
      imageHeight,
    } = this.state;

    const [buttonColor, buttonText] = (() => {
      const mode = this.state.selectedMode;
      const nextTxt = (mode === DataCollectionModeStr ? '次' : '正解確認');

      if (clickedAreas.length === 0) {
        return [
          'primary',
          `良品と判断した場合、こちらを押して${nextTxt}へ`];
      } else {
        return [
          'secondary',
          `選択したタイルを、↑の理由で不良箇所として${nextTxt}へ`];
      }
    })();

    const Checkboxes = (() => {
      return defectTypes.map((defectType, index) => {
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={this.state[defectType]}
                onChange={this.handleCheckboxChange(defectType)}
                value={defectType}
              />
            }
            label={defectType}
            key={index}
          />
        );
      });
    });

    // const defectChecked = Object.keys(this.state).filter((e) => )
    const isDefectTypeChecked = defectTypes.map(
      (defectType) => this.state[defectType],
    ).filter((isChecked) => isChecked).length > 0;

    const buttonDisable = (() => {
      if (clickedAreas.length === 0) {
        return false;
      } else if (isDefectTypeChecked) {
        return false;
      } else if (!isDefectTypeChecked) {
        return true;
      }
    })();

    const dataRows = (() => {
      try {
        const machineResult = this.state.machineCheckResult[nthQuestion];
        return [createData(machineResult[1], machineResult[2])];
      } catch (e) {
        return [createData('Loading', 'Loading')];
      }
    })();

    return (
      <div className="App">
        <header className="App-header">
          良品or不良品?<br/>
        </header>

        <AppLayoutGrid>
          <LeftPane area='leftPane'>
            <div>
              <FormControl component="fieldset" className="mode-select">
                {/*<FormLabel component="legend">モード選択</FormLabel>*/}
                <RadioGroup
                  aria-label="mode-select"
                  name="mode-select"
                  className="mode-select"
                  value={this.state.selectedMode}
                  onChange={this.handleRadioButtonChange}
                >
                  <FormControlLabel value={DataCollectionModeStr}
                                    control={<Radio/>}
                                    label="データ収集モード"/>
                  <FormControlLabel value={AnsweringModeStr}
                                    control={<Radio/>}
                                    label="問題解答モード"/>
                </RadioGroup>
              </FormControl>
            </div>

            <TextField
              id="subject-id"
              label="実験者ID"
              className="TextField"
              value={this.state.subjectId}
              onChange={this.handleChange('subjectId')}
              margin="normal"
              key='subjectId'
            />
          </LeftPane>
          <Pane area='centerPane'>

            {/*<div style={{*/}
            {/*display: 'flex',*/}
            {/*justifyContent: 'flex-end',*/}
            {/*alignItems: 'center',*/}
            {/*}}>*/}
            {/*<div style={{marginRight: '146px'}}>*/}
            {/*<StyledQuestionNumberText nthQuestion={this.state.nthQuestion}*/}
            {/*className='styled-question-number'/>*/}
            {/*<div>*/}
            {/*経過時間: {this.state.timeUsed}*/}
            {/*</div>*/}
            {/*</div>*/}
            {/*<div style={{marginRight: '10px', marginTop: '30px'}}>*/}
            {/*<Button variant="contained"*/}
            {/*onClick={this.handleInitializePosition}>*/}
            {/*{'初期位置に戻す'}*/}
            {/*</Button>*/}
            {/*</div>*/}
            {/*</div>*/}

            <Row>
              <Col xsOffset={5} xs={2}>
                <StyledQuestionNumberText nthQuestion={this.state.nthQuestion}
                                          className='styled-question-number'/>
                <div>
                  経過時間: {this.state.timeUsed}
                </div>
              </Col>
              <Col xsOffset={2} xs={3}>
                <div style={{marginRight: '10px', marginTop: '30px'}}>
                  <Button variant="contained"
                          onClick={this.handleInitializePosition}>
                    {'初期位置に戻す'}
                  </Button>
                </div>
              </Col>
            </Row>


            <PannableAndZoomableHOC
              x={x}
              y={y}
              scale={scale}
              scaleFactor={Math.sqrt(2)}
              minScale={0.5}
              maxScale={1}
              onPanAndZoom={(x, y, scale) => this.handlePanAndZoom(x, y,
                scale)}
              style={{
                width: '100%',
                minWidth: '50%',
                // height: imageHeight,
                paddingTop: '100%',
                border: '1px solid black',
                position: 'relative',
                overflow: 'hidden',
                margin: '20px 0 20px 0px',

              }}
              onPanMove={(x, y) => this.handlePanMove(x, y)}
            >
              <div className="SquareContainer" style={{
                position: 'absolute',
                width: '100%',
                top: '0',
                bottom: '0',
                boxSizing: 'border-box',
                transform: `translate(${(x - 0.5) * imageWidth}px, ${(y -
                  0.5) *
                imageHeight}px) scale(${1 / scale})`,
              }}>
                <Squares gridLength={gridLength}
                         clickedAreas={clickedAreas}
                         onUpdate={this.handleAreaClick}
                         nthQuestion={nthQuestion}
                         imageHeight={imageHeight}
                         imageWidth={imageWidth}
                />
              </div>

            </PannableAndZoomableHOC>


            {clickedAreas.length > 0 &&
            <div>
              {/*<div>*/}
              {/*<StyledReasonTextField*/}
              {/*id="defect-reason"*/}
              {/*label="不良の理由"*/}
              {/*className="reasonTextField"*/}
              {/*value={defectReason}*/}
              {/*onChange={this.handleChange('defectReason')}*/}
              {/*margin="normal"*/}
              {/*key='reason'*/}
              {/*/>*/}
              {/*</div>*/}
              <h3>不良の理由</h3>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '-20px',
              }}>
                <FormGroup row>
                  <Checkboxes/>
                </FormGroup>
              </div>
            </div>
            }


            <div>
              <Button variant="contained"
                      color={buttonColor}
                      onClick={this.handleNextButtonClick}
                      disabled={buttonDisable}>
                {buttonText}
              </Button>
            </div>
          </Pane>

          <Pane area="rightPane">
            {this.state.machineCheckResult[0] &&
            <MachineCheckResultTable rows={dataRows}/>
            }

            {this.state.data['1'] &&
            this.state.selectedMode === 'Answering' &&
            this.state.shownView === 'Answer' &&
            <StyledCorrectOrWrong
              isCorrect={JSON.stringify(
                this.state.data[this.state.nthQuestion]['answers']) ===
              JSON.stringify(clickedAreas)}
              className='styled-correct'/>}

            {this.state.shownView === 'Answer' &&
            <AnswerGrid
              answer={this.state.data[nthQuestion]['answers'].join(',')}
              defectReason={this.state.data[nthQuestion]['reason']}/>}

            {this.state.shownView === 'Answer' &&
            <div>
              <Button variant="contained" color={buttonColor}
                      onClick={this.handleNextButtonClickInAnswerView}>次へ</Button>
            </div>}


          </Pane>
        </AppLayoutGrid>
      </div>
    );
  }
}

export default App;


