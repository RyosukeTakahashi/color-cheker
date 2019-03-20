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
//imported libraries
import styled from 'styled-components';
import axios from 'axios';
import firebase from 'firebase/app';
import 'firebase/firestore';
import {firebaseConfig} from './firebase/config.js';
import panAndZoomHoc from 'react-pan-and-zoom-hoc';
import Papa from 'papaparse';
import {Col, Row} from 'react-flexbox-grid';
//hand=made component
import Squares from './Squares';
import {StyledQuestionNumberText} from './QuestionNumberText';
import {StyledCorrectOrWrong} from './CorrectOrWrong';
import {MachineCheckResultTable} from './MachineCheckResultTable';
import Table from '@material-ui/core/Table/Table';
import TableHead from '@material-ui/core/TableHead/TableHead';
import TableRow from '@material-ui/core/TableRow/TableRow';
import TableCell from '@material-ui/core/TableCell/TableCell';
import TableBody from '@material-ui/core/TableBody/TableBody';
import Paper from '@material-ui/core/Paper/Paper';
import Toolbar from '@material-ui/core/Toolbar/Toolbar';
import {Checkboxes} from './Checkboxes';
import InputLabel from '@material-ui/core/InputLabel/InputLabel';
import Select from '@material-ui/core/Select/Select';
import MenuItem from '@material-ui/core/MenuItem/MenuItem';

//--done 正解表示UIを作成
//--done モード選択を用意。
//--done(問題ID,正解) correct_answers.csv用意
//--done 良品/不良判断ボタンを用意。
//--done 解答時間を計測する。
//--done 次行くときにデータを送信する
//--done 初期化
//--done 画像拡大機能
//--done 欠点の種類を選べるようにする
//--done idをセレクタにする。
//--done csv // user, show_on_nth, img_id(img_path)
//--done 設定後、いじれないようにする
//todo 画像のファイル名の仕様決定
//todo サンプル画像を使う
//todo 自由テキスト入れる
//todo 表示画像の数を可変にする（2 or 3）

//todo 出すテーブルを画像に合わせる(大洋にCSVもらう)
//todo GCPつなぎ込み
//todo トレーニングモードの仕様を確定する


//検出レベルを適切に設定できない新人
//検出されたやつをとりあえずNGにしてしまう（OKなやつもあるのに）

//constants settings
export const firebaseApp = firebase.initializeApp(firebaseConfig);
export const db = firebaseApp.firestore();
const gridLength = 5;
const DataCollectionModeStr = 'DataCollection';
const AnsweringModeStr = 'Answering';
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

const StyledPaper = styled(Paper)`
width: 300px;
margin: 100px 0 40px 20px;
`;

const StyledToolbar = styled(Toolbar)`
  background: aliceblue;
`;

const StyledFormControl = styled(FormControl)`
&& {
  min-width: 100px;
}
`;

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
  subjectId: '',
  nthQuestion: 1,
  selectedMode: 'DataCollection',
  data: {},
  defectTypes: ['suji', 'fish'],
  machineCheckResult: [],
  imageWidth: 600,
  imageHeight: 600,
  isStarted: false,
  imgId: 0,
  end: false,
}, initializedStateOnButtonClicked);

class App extends Component {

  state = appState;

  componentDidMount() {
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

    this.getChoices().catch(err => console.log(err));
    this.getImgOrder().catch(err => console.log(err));
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  static async getAnswer() {
    const res = await axios('./correct_answers.json');
    return await res.data;
  };

  static async getCsv() {
    const res = await axios('./sample_dropped.csv');
    return await res.data;
  };

  getChoices = async () => {
    const res = await axios('./defect_type_choices.csv');
    const data = await res.data;
    const defectTypes = await data.split(',');
    this.setState({defectTypes});
    defectTypes.forEach(defectType => {
      this.setState({[defectType]: false});
    });
  };

  getImgOrder = async () => {
    const res = await axios('./img_order.csv');
    const data = await res.data;
    const imgOrder = Papa.parse(data, {
      header: true,
      dynamicTyping: true,
    }).data;
    this.setState({imgOrder});
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
      this.setImgId();
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
      this.state.defectTypes.forEach((defectType) => {
        initializedStateOnButtonClicked[defectType] = false;
      });
      initializedStateOnButtonClicked['nthQuestion'] = prevState.nthQuestion +
        1;

      return initializedStateOnButtonClicked;
    });

  }

  handleStartButtonClick = () => {
    this.setState({isStarted: true});
    this.setImgId();
    this.startTimer();
  };

  setImgId = () => {
    this.setState(previousState => {
      try {
        const imgId = previousState.imgOrder.filter((row) => {
          return (row['user'] === previousState.subjectId) &&
            (row['show_on_nth'] === previousState.nthQuestion);
        })[0]['img_id'];
        return {imgId};
      } catch (e) {
        this.setState({end: true});
      }
    });
  };

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
    this.setImgId();
    this.startTimer();
  };

  getFilteredState = (raw, allowed) => {
    return Object.keys(raw)
      .filter(key => allowed.includes(key))
      .reduce((obj, key) => {
        obj[key] = raw[key];
        return obj;
      }, {});
  };

  render() {

    const {
      clickedAreas,
      nthQuestion,
      x,
      y,
      scale,
      imageWidth,
      imageHeight,
      defectTypes,
      imgId,
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

    const isDefectTypeChecked = defectTypes.map(
      (defectType) => this.state[defectType],
    ).filter((isChecked) => isChecked).length > 0;

    const buttonDisable = (() => {
      if (this.state.timeUsed === 0) {
        return true;
      }
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

    const paneDisplay = (() => {
      if (this.state.end) {
        return 'none';
      }
      return this.state.isStarted ? 'block' : 'none';
    })();

    const settingsFormDisabled = this.state.isStarted ? true : false;

    return (
      <div className="App">
        <header className="App-header">
          良品or不良品?<br/>
        </header>

        <AppLayoutGrid>
          <LeftPane area='leftPane'>
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
                                  label="データ収集モード"
                                  disabled={settingsFormDisabled}/>
                <FormControlLabel value={AnsweringModeStr}
                                  control={<Radio/>}
                                  label="問題解答モード"
                                  disabled={settingsFormDisabled}/>
              </RadioGroup>
            </FormControl>

            <StyledFormControl>
              <InputLabel htmlFor="age-simple">被験者ID</InputLabel>
              <Select
                value={this.state.subjectId}
                onChange={this.handleChange('subjectId')}
                inputProps={{
                  name: 'subjectID',
                  id: 'age-simple',
                }}
                disableUnderline={settingsFormDisabled}
              >
                <MenuItem value="" disabled={settingsFormDisabled}>
                  <em>None</em>
                </MenuItem>
                <MenuItem value={1} disabled={settingsFormDisabled}>1</MenuItem>
                <MenuItem value={2} disabled={settingsFormDisabled}>2</MenuItem>
                <MenuItem value={3} disabled={settingsFormDisabled}>3</MenuItem>
              </Select>
            </StyledFormControl>
            {this.state.subjectId &&
            <div style={{marginTop: '20px'}}>
              <Button variant="contained"
                      onClick={this.handleStartButtonClick}
                      disabled={settingsFormDisabled}>
                {`ID:${this.state.subjectId}の計測を開始する`}
              </Button>
            </div>
            }

          </LeftPane>

          <Pane area='centerPane'>

            <div style={{
              display: this.state.end ? 'flex' : 'none',
              paddingTop: '50%',
            }}>
              ID:{this.state.subjectId}の方の実験終了です。お疲れ様でした。
              <br/>
              やり直す場合、ページをF5キーで更新してください。
            </div>
            <div style={{display: paneDisplay}}>
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
                           imgId={imgId}
                  />
                </div>

              </PannableAndZoomableHOC>




              {clickedAreas.length > 0 &&
              <div>
                <h3>不良の理由</h3>

                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: '-20px',
                }}>
                  <FormGroup row>
                    <Checkboxes defectTypes={defectTypes}
                                filteredState={this.getFilteredState(this.state,
                                  defectTypes)}
                                handleCheckboxChange={this.handleCheckboxChange}/>
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
            </div>
          </Pane>

          <Pane area="rightPane" style={{display: paneDisplay}}>
            {this.state.machineCheckResult[0] &&
            <MachineCheckResultTable rows={dataRows}/>
            }

            {this.state.data['1'] &&
            this.state.shownView === 'Answer' &&
            <StyledPaper>
              <StyledToolbar>
                回答結果： <StyledCorrectOrWrong
                isCorrect={JSON.stringify(
                  this.state.data[this.state.nthQuestion]['answers']) ===
                JSON.stringify(clickedAreas)}
                className='styled-correct'/>
              </StyledToolbar>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell align='center'>不良箇所</TableCell>
                    <TableCell align='center'>不良理由</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell align='center' component="th">
                      {this.state.data[nthQuestion]['answers'].join(',')}
                    </TableCell>
                    <TableCell align='center'>
                      {this.state.data[nthQuestion]['reason']}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </StyledPaper>
            }

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


