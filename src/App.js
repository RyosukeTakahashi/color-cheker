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
import {MuiThemeProvider, createMuiTheme} from '@material-ui/core/styles';
//imported libraries
import styled from 'styled-components';
import axios from 'axios';
// import firebase from 'firebase/app';
import firebase from 'firebase';
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
import RefOrInj from './RefOrInj';

//--done 正解表示UIを作成
//--done モード選択を用意。
//--done(問題ID,正解) correct_answers.csv用意
//--done 良品/不良判断ボタンを用意。
//--done 解答時間を計測する。
//--done 次行くときにデータを送信する
//--done 初期化
//--done  画像拡大機能
//--done 欠点の種類を選べるようにする
//--done idをセレクタにする。
//--done csv // user, show_on_nth, img_id(img_path)
//--done 設定後、いじれないようにする
//--done 3つの画像boxを用意
//--done 自由テキスト入れる
//--done 2-2では画像を一つのみ表示
//todo 実画像とCSVの用意, GCPつなぎ込み
//todo クリックで画像切り替え

//検出レベルを適切に設定できない新人
//検出されたやつをとりあえずNGにしてしまう（OKなやつもあるのに）

//constants settings
import JssProvider from 'react-jss/lib/JssProvider';
import {create} from 'jss';
import {createGenerateClassName, jssPreset} from '@material-ui/core/styles';

const generateClassName = createGenerateClassName();
const jss = create({
  ...jssPreset(),
  // We define a custom insertion point that JSS will look for injecting the styles in the DOM.
  insertionPoint: document.getElementById('jss-insertion-point'),
});
const theme = createMuiTheme({
  typography: {
    // Tell Material-UI what's the font-size on the html element is.
    fontSize: 30,
    useNextVariants: true,
  },
});

export const firebaseApp = firebase.initializeApp(firebaseConfig);
export const db = firebaseApp.firestore();
const gridLength = 5;
const DataCollectionModeStr = 'DataCollection';
const AnsweringModeStr = 'Answering';
const paneNames = ['leftPane', 'centerPane'];
const paneWidth = ['230px', '1fr'];
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

const StyledTextField = styled(TextField)`
margin-top: -8px;
`;

const StyledFlexRadioGroup = styled(RadioGroup)`
 display: flex;
 justify-content: center;
 flex-direction: row;
`;

const StyledFormGroup = styled(FormGroup)`
  max-width: 900px;
`;

const initialPosition = {
  x: 0.5,
  y: 0.5,
  scale: 1,
};

const initializedStateOnButtonClicked = Object.assign({
  clickedAreas: [], //[] in production
  defectReason: '',
  recoveryText: '',
  timeUsed: 0,//0 in production
  startTimestamp: new Date(),
  shownView: 'Question',
  selectedOkNgDel: 'OK',
  judgeReason: '',
  selectedConfidence: 0,
  pauseTimer: false,
  showRef: true
}, initialPosition);

const appState = Object.assign({
  subjectId: 1, //0 in production
  nthQuestion: 1,
  selectedMode: 'DataCollection',
  expId: '2-1',//'' in production?
  expPlan: [],
  data: {},
  defectTypes: ['suji', 'fish'],
  recoveryChoices: [],
  machineCheckResult: [],
  imageWidth: 600,
  imageHeight: 600,
  isStarted: false,//false in production
  imgId: 0,
  end: false,
}, initializedStateOnButtonClicked);

const storage = firebase.storage();

class App extends Component {

  state = appState;

  async componentDidMount() {
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
      this.setState(
        {machineCheckResult: Papa.parse(csv, {header: true})['data']});
    }).catch(err => {
      console.log(err);
    });

    this.getChoices().catch(err => console.log(err));
    this.getRecoveryChoices().catch(err => console.log(err));
    this.getImgOrder().catch(err => console.log(err));
    await this.getExpPlanCSV(this.state.expId).catch(err => console.log(err));
    // await this.getImgPath('SMP');
    // await this.generateReferenceToFile();
  }


  handleExpIdChange = (event) =>{
    this.setState({expId: event.target.value}, async () => {
      await this.getExpPlanCSV(this.state.expId).catch(err => console.log(err));
    });
  };
  handleOnRefClick = () => {
    this.setState((prevState) =>{
      return {showRef: !prevState.showRef}
    });
  };

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  static async getAnswer() {
    const res = await axios('./correct_answers.json');
    return await res.data;
  };

  static async getCsv(expId) {
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

  getRecoveryChoices = async () => {
    const res = await axios('./recovery_action_choices.csv');
    const data = await res.data;
    const recoveryChoices = await data.split(',');
    this.setState({recoveryChoices});
    recoveryChoices.forEach(choice => {
      this.setState({[choice]: false});
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

  getExpPlanCSV = async (expId) => {
    const res = await axios(`./${expId}.csv`);
    const data = await res.data;
    const expPlan = Papa.parse(data, {
      header: true,
      // dynamicTyping: true, //it would make file name change.
    }).data;
    this.setState({expPlan});

  };

  getImgPath = (imgType) => {
    this.setState(previousState => {
      try {
        console.log(previousState.subjectId, previousState.nthQuestion);
        const row = previousState.expPlan.filter((row) => {
          return (row['subjectId'] === String(previousState.subjectId)) &&
            (row['showOnNth'] === String(previousState.nthQuestion));
        })[0];
        const imgPath = `${row.path1}/${row.path2}/${imgType}${row.path3}.BMP`;
        return {imgPath};
      } catch (e) {
        console.log(e);
        this.setState({end: true});
      }
    });
  };

  generateReferenceToFile = () => {
    const pathSmp = `${this.state.imgPath.replace('__', '___')}`;
    if (this.state.expId === '2-1') {
      const pathInj = pathSmp.replace('SMP', 'INJ');
      const pathRef = pathSmp.replace('SMP', 'REF');
      const pathRefInj = storage.ref(pathInj);
      pathRefInj.getDownloadURL().then(imgUrlInj => {
        this.setState({imgUrlInj});
      });
      const pathRefRef = storage.ref(pathRef);
      pathRefRef.getDownloadURL().then(imgUrlRef => {
        this.setState({imgUrlRef});
      });
    }
    const pathRefSmp = storage.ref(pathSmp);
    pathRefSmp.getDownloadURL().then(imgUrlSmp => {
      this.setState({imgUrlSmp});
    });

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

  handleStartButtonClick = async () => {
    this.setState({isStarted: true});
    await this.getImgPath('SMP');
    await this.generateReferenceToFile();
    this.startTimer();
  };

  moveToNextQuesiton = async () => {
    const {data, machineCheckResult, defectTypes, expPlan, imageHeight, imageWidth, imgOrder, recoveryChoices, ...stateWOanswerData} = this.state; // deletes data from state non-destructively
    db.collection('answers_prodcution').add(stateWOanswerData).then(docRef => {
      console.log('Document written with ID: ', docRef.id);
    }).catch(error => {
      console.error('Error adding document: ', error);
    });
    if (this.state.selectedMode === DataCollectionModeStr) {
      this.initializeForNextQuestion();
      // this.setImgId();
      await this.getImgPath('SMP');
      await this.generateReferenceToFile();
      this.startTimer();
    }
  };

  handleButtonClick = () => {
    console.log('timer stop');
    this.stopTimer();
    switch (this.state.shownView) {
      case 'Question':
        if (this.state.clickedAreas.length > 0) {
          this.setState({shownView: 'recoveryChoice'});
        } else if (this.state.clickedAreas.length === 0) {
          this.moveToNextQuesiton();
        }
        break;
      case 'recoveryChoice':
        this.moveToNextQuesiton();
        break;
      case 'Answer':
        break;
      default:
        break;
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
      this.state.recoveryChoices.forEach((choice) => {
        initializedStateOnButtonClicked[choice] = false;
      });
      initializedStateOnButtonClicked['nthQuestion'] = prevState.nthQuestion +
        1;

      return initializedStateOnButtonClicked;
    });

  }


  setImgId = () => {
    this.setState(previousState => {
      try {
        console.log(previousState.subjectId, previousState.nthQuestion);
        const imgId = previousState.imgOrder.filter((row) => {
          return (row['user'] === previousState.subjectId) &&
            (row['show_on_nth'] === previousState.nthQuestion);
        })[0]['img_id'];
        return {imgId};
      } catch (e) {
        console.log(e);
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
    if (!this.state.pauseTimer) {
      this.setState(prevState => {
        return {timeUsed: prevState.timeUsed + 1};
      });
    }
  };

  handlePauseTogglerClick = () => {
    this.setState((prevState) => {
      return {pauseTimer: !prevState.pauseTimer};
    });
  };

  handleRadioButtonChange = event => {
    this.setState({selectedMode: event.target.value});
  };

  handleOkNgDelRadioButtonChange = event => {
    this.setState({selectedOkNgDel: event.target.value});
  };
  handleConfidenceRadioButtonChange = event => {
    this.setState({selectedConfidence: event.target.value});
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
      recoveryChoices,
      imgId,
      shownView,
      defectReason,
      recoveryText,
      selectedConfidence,
      machineCheckResult,
      pauseTimer,
      expId,
      imgUrlSmp,
      imgUrlRef,
      imgUrlInj,
      showRef
    } = this.state;

    const [pauseButtonColor, pauseButtonText] = (() => {
      if (pauseTimer) {
        return ['secondary', '再開'];
      } else {
        return ['default', '一時停止'];
      }
    })();

    const [buttonColor, buttonText] = (() => {
      const mode = this.state.selectedMode;
      const nextTxt = (mode === DataCollectionModeStr ? '次' : '正解確認');

      if (shownView === 'Question') {
        if (clickedAreas.length === 0 && shownView) {
          return [
            'primary',
            `良品と判断した場合、こちらを押して${nextTxt}へ`];
        } else {
          return [
            'secondary',
            `選択したタイルを、↑の理由で不良箇所として${nextTxt}へ`];
        }
      } else if (shownView === 'recoveryChoice') {
        return [
          'secondary',
          `↑をこの不良の処置として${nextTxt}へ`];
      }
    })();

    const isDefectTypeChecked = defectTypes.map(
      (defectType) => this.state[defectType],
    ).filter((isChecked) => isChecked).length > 0;

    const isrecoveryActionChecked = recoveryChoices.map(
      (choice) => this.state[choice],
    ).filter((isChecked) => isChecked).length > 0;

    const buttonDisable = (() => {

      if (shownView === 'Question') {

        if (defectReason.length > 0) {
          return false;
        }

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
      } else if (shownView === 'recoveryChoice') {

        const recoveryAnswered = recoveryText.length > 0 ||
          isrecoveryActionChecked;
        const confidenceAnsweed = selectedConfidence !== 0;
        return !(recoveryAnswered && confidenceAnsweed);
      }
    })();

    // const dataRows = (() => {
    //   try {
    //     const machineResult = machineCheckResult[nthQuestion];
    //     return [createData(machineResult[1], machineResult[2])];
    //   } catch (e) {
    //     return [createData('Loading', 'Loading')];
    //   }
    // })();

    const paneDisplay = (() => {
      if (this.state.end) {
        return 'none';
      }
      return this.state.isStarted ? 'block' : 'none';
    })();

    const settingsFormDisabled = this.state.isStarted;

    return (
      <JssProvider jss={jss} generateClassName={generateClassName}>

        <div className="App">

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
                <InputLabel htmlFor="age-simple">実験ID</InputLabel>
                <Select
                  value={this.state.expId}
                  // onChange={this.handleChange('expId')}
                  onChange={this.handleExpIdChange}
                  inputProps={{
                    name: 'expID',
                    id: 'expID',
                  }}
                  disableUnderline={settingsFormDisabled}
                >
                  <MenuItem value="" disabled={settingsFormDisabled}>
                    <em>None</em>
                  </MenuItem>
                  <MenuItem value={'2-1'}
                            disabled={settingsFormDisabled}>2-1</MenuItem>
                  <MenuItem value={'2-2'}
                            disabled={settingsFormDisabled}>2-2</MenuItem>
                </Select>
              </StyledFormControl>

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
                  <MenuItem value={1}
                            disabled={settingsFormDisabled}>1</MenuItem>
                  <MenuItem value={2}
                            disabled={settingsFormDisabled}>2</MenuItem>
                  <MenuItem value={3}
                            disabled={settingsFormDisabled}>3</MenuItem>
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
                ID:{this.state.subjectId}の方の実験終了です。お疲れ様でした。<br/>
                実験1は40問、実験2は24問あったと思われます。そこに満たずにこれが表示されている場合、実験スタッフにお申し付けください。<br/>
                <br/>
                やり直す場合、ページをF5キーで更新してください。
              </div>
              <div style={{display: paneDisplay}}>
                <Row>
                  <Col xsOffset={4} xs={4}>
                    <StyledQuestionNumberText
                      nthQuestion={this.state.nthQuestion}
                      className='styled-question-number'/>
                    <div>
                      経過時間: {this.state.timeUsed}
                    </div>
                  </Col>
                  <Col xs={4}>
                    <MuiThemeProvider theme={theme}>
                      <Button variant="contained"
                              onClick={this.handlePauseTogglerClick}
                              color={pauseButtonColor}
                      >{pauseButtonText}</Button>
                    </MuiThemeProvider>
                  </Col>
                </Row>

                {/*<div style={{*/}
                {/*display: 'flex',*/}
                {/*width: '100%',*/}
                {/*justifyContent: 'center',*/}
                {/*overflow: 'hidden',*/}
                {/*paddingTop: (248 / 1008) * 100 + '%',*/}
                {/*position: 'relative',*/}
                {/*border: 1,*/}
                {/*borderStyle: 'solid',*/}
                {/*backgroundImage: 'url(\'https://dummyimage.com/1008x256/a8a8a8/ffffff&text=製品全体画像\')',*/}

                {/*}}>*/}
                {/*<div style={{*/}
                {/*position: 'absolute',*/}
                {/*top: 0,*/}
                {/*left: 0,*/}
                {/*width: '90%',*/}
                {/*// height: 200,*/}
                {/*}}>*/}
                {/*</div>*/}
                {/*</div>*/}

                <div style={{display: 'flex', justifyContent: 'space-around'}}>


                  {expId === '2-1' &&
                  <PannableAndZoomableHOC
                    x={x}
                    y={y}
                    scale={scale}
                    scaleFactor={Math.sqrt(2)}
                    minScale={0.5}
                    maxScale={1}
                    // onPanAndZoom={(x, y, scale) => this.handlePanAndZoom(x, y,
                    //   scale)}
                    style={{
                      width: '45%',
                      minWidth: '40%',
                      paddingTop: '45%',
                      border: '1px solid black',
                      position: 'relative',
                      overflow: 'hidden',
                      margin: '20px 0 20px 0px',

                    }}
                    // onPanMove={(x, y) => this.handlePanMove(x, y)}
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
                      <RefOrInj gridLength={gridLength}
                                clickedAreas={clickedAreas}
                                onUpdate={this.handleAreaClick}
                                nthQuestion={nthQuestion}
                                imageHeight={imageHeight}
                                imageWidth={imageWidth}
                                imgId={imgId}
                                imgUrlRef={imgUrlRef}
                                imgUrlInj={imgUrlInj}
                                showRef={showRef}
                                clickHandler={this.handleOnRefClick}
                      />
                    </div>
                  </PannableAndZoomableHOC>
                  }

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
                      width: '45%',
                      minWidth: '40%',
                      paddingTop: '45%',
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
                               imgUrl={imgUrlSmp}
                      />
                    </div>
                  </PannableAndZoomableHOC>


                </div>
                <MuiThemeProvider theme={theme}>

                  <Row>

                    <Col xs={10}>
                      {this.state.machineCheckResult[0] &&
                      expId === '2-3' &&
                      <MachineCheckResultTable
                        rows={machineCheckResult[nthQuestion]}/>
                      }
                    </Col>
                    <Col xs={2}>
                      <Button variant="contained"
                              onClick={this.handleInitializePosition}>
                        {'初期位置に戻す'}
                      </Button>
                    </Col>

                  </Row>

                  {clickedAreas.length > 0 && this.state.shownView !==
                  'recoveryChoice' &&

                  <div style={{fontSize: 36}}>
                    <Row>
                      <Col xsOffset={4} xs={4}>
                        <h3>不良の理由</h3>
                      </Col>
                    </Row>


                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      marginTop: '-20px',
                    }}>
                      <StyledFormGroup row>
                        <Checkboxes choices={defectTypes}
                                    filteredState={this.getFilteredState(
                                      this.state,
                                      defectTypes)}
                                    handleCheckboxChange={this.handleCheckboxChange}/>
                        <StyledTextField id="defectReason"
                                         label="自由記述"
                          // className={classes.textField}
                                         value={this.state.defectReason}
                                         onChange={this.handleChange(
                                           'defectReason')}
                        />

                      </StyledFormGroup>
                    </div>
                  </div>
                  }


                  {this.state.shownView === 'recoveryChoice' &&
                  <div style={{fontSize: 36}}>
                    <Row>
                      <Col xsOffset={4} xs={4}>
                        <h3>判定</h3>
                      </Col>
                    </Row>
                    <FormControl component="fieldset" className="mode-select">
                      {/*<FormLabel component="legend">モード選択</FormLabel>*/}
                      <StyledFlexRadioGroup
                        aria-label="ok-ng-del"
                        name="ok-ng-del"
                        className="ok-ng-del"
                        value={this.state.selectedOkNgDel}
                        onChange={this.handleOkNgDelRadioButtonChange}
                      >
                        <FormControlLabel value={'OK'}
                                          control={<Radio/>}
                                          label="OK"
                        />
                        <FormControlLabel value={'NG'}
                                          control={<Radio/>}
                                          label="NG"
                        />
                        <FormControlLabel value={'DEL'}
                                          control={<Radio/>}
                                          label="Del"
                        />
                      </StyledFlexRadioGroup>
                    </FormControl>
                    <div>
                      <StyledTextField id="judgeReason"
                                       label="判定理由"
                                       value={this.state.judgeReason}
                                       onChange={this.handleChange(
                                         'judgeReason')}
                      />
                    </div>

                    <Row>
                      <Col xsOffset={4} xs={4}>
                        <h3 style={{marginTop: 40}}>取るべき処置</h3>
                      </Col>
                    </Row>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      marginTop: '-20px',
                      // maxWidth: '600px'
                    }}>
                      <StyledFormGroup row>
                        <Checkboxes choices={recoveryChoices}
                                    filteredState={this.getFilteredState(
                                      this.state,
                                      recoveryChoices)}
                                    handleCheckboxChange={this.handleCheckboxChange}/>
                        <StyledTextField id="recoveryChoice"
                                         label="自由記述"
                                         value={this.state.recoveryText}
                                         onChange={this.handleChange(
                                           'recoveryText')}
                        />

                      </StyledFormGroup>
                    </div>
                    <Row>
                      <Col xsOffset={4} xs={4}>
                        <h3 style={{marginTop: 40}}>判定の確信度</h3>
                      </Col>
                    </Row>
                    <StyledFlexRadioGroup
                      aria-label="ok-ng-del"
                      name="ok-ng-del"
                      className="ok-ng-del"
                      value={this.state.selectedConfidence}
                      onChange={this.handleConfidenceRadioButtonChange}
                    >
                      {Array(10).fill(0).map((e, index) => {

                        return <FormControlLabel value={String(index + 1)}
                                                 control={<Radio/>}
                                                 label={String(index + 1)}
                                                 key={index}
                        />;
                      })}
                    </StyledFlexRadioGroup>

                  </div>
                  }
                  <div style={{marginTop: 30}}>
                    <Button variant="contained"
                            color={buttonColor}
                      // onClick={this.handleNextButtonClick}
                            onClick={this.handleButtonClick}
                            disabled={buttonDisable}>
                      {buttonText}
                    </Button>
                  </div>
                </MuiThemeProvider>

              </div>
            </Pane>

            <Pane area="rightPane" style={{display: paneDisplay}}>

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
      </JssProvider>
    );
  }
}

export default App;


