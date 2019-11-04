import React, {Component} from 'react';
import './App.css';

//Material UI
import Button from '@material-ui/core/Button';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import {MuiThemeProvider} from '@material-ui/core/styles';
import Table from '@material-ui/core/Table/Table';
import TableHead from '@material-ui/core/TableHead/TableHead';
import TableRow from '@material-ui/core/TableRow/TableRow';
import TableCell from '@material-ui/core/TableCell/TableCell';
import TableBody from '@material-ui/core/TableBody/TableBody';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select/Select';
import MenuItem from '@material-ui/core/MenuItem/MenuItem';

//imported libraries
import axios from 'axios';

// import firebase from 'firebase/app';
import 'firebase/firestore';
import panAndZoomHoc from 'react-pan-and-zoom-hoc';
import Papa from 'papaparse';
import {Col, Row} from 'react-flexbox-grid';

//hand-made component
import Squares from './Squares';
import {StyledQuestionNumberText} from './QuestionNumberText';
import {StyledCorrectOrWrong} from './CorrectOrWrong';
import {MachineCheckResultTable} from './MachineCheckResultTable';
import {Checkboxes} from './Checkboxes';
import RefOrInj from './RefOrInj';

//constants settings
import JssProvider from 'react-jss/lib/JssProvider';
import {
  AnsweringModeStr,
  AppLayoutGrid,
  DataCollectionModeStr,
  generateClassName,
  gridLength,
  jss,
  LeftPane,
  Pane,
  db,
  storage,
  StyledFlexRadioGroup,
  StyledLeftPaneRadioGroup,
  StyledFormControl,
  StyledFormGroup,
  StyledPaper,
  StyledTextField,
  StyledToolbar,
  theme,
} from './constants';
import {ExperimentEndMessage} from './ExperimentEndMessage';

//課題感
//検出レベルを適切に設定できない新人
//検出されたやつをとりあえずNGにしてしまう（OKなやつもあるのに）

//Todo
// 辻くんが生成してくれたjsonデータを呼んで、画像&正解読めるように。
// 欠点分類を選ぶ→欠点箇所を選ぶを0回以上できるようにする

//Todo 優先順位 ３>>４>２>１
// １）サインアップ－ 任意のIDを新規登録（既にDBにあるIDは使わない）
//  (1) Googleアカウントを作成する（仕事用に）　パスワード必要？
//  (2)Googleアカウントを読み込んでログイン．
// ２）ログイン（登録したGoogleアカウントを使って）
// ３）アカウントで出力画像を統制（回答していない画像＞不正解の画像＞正解した画像）
// ①出力したい画像のフォルダを選ぶ　〇
// 　②実験に使いたいファイルフォルダーオリジナルフォルダー厳選した画像ファイル ○
// ・CSV一覧で指定（2018年度の実験２のように、出力順番決められる）
// 欠点のcsvの当該行を併記する以外に、全体画像も、表示してほしいとのこと。ポップアップでも可
// ４）アカウントで成績管理（レポート）

const PannableAndZoomableHOC = panAndZoomHoc('div');

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
  showRef: true,
}, initialPosition);

const appState = Object.assign({
  subjectId: 1, //0 in production
  userIdNum: '123ABC',
  nthQuestion: 1,
  selectedMode: AnsweringModeStr,
  imgFolderPaths: [],
  selectedImgFolder: 'exp021000001/20190829_070748___K', //exp021000001/20190829_070748___K
  expId: '2-1',//'' in production
  expPlan: [],
  data: {}, // answer data
  defectTypes: ['suji', 'fish'],
  recoveryChoices: [],
  machineCheckResult: [],
  imageWidth: 600,
  imageHeight: 600,
  isStarted: false,//false in production
  imgId: 0,
  end: false,
}, initializedStateOnButtonClicked);

class App extends Component {

  state = appState;

  async componentDidMount() {
    this.getAnswer().catch(err => console.log(err));
    this.getMachineCheckResultCsv().catch(err => console.log(err));
    this.getChoices().catch(err => console.log(err));
    this.getRecoveryChoices().catch(err => console.log(err));
    this.getListOfFirebaseStorage().catch(err => console.log(err));
    this.getDownloadUrlsOfImgInFolder().catch(err => console.log(err));
    await this.getExpPlanCSV(this.state.expId).catch(err => console.log(err));

    //todo: add getImgDownLoadUrls()

    //todo: edit getExpPlanCsv → use list of firebase storage
    //todo: edit getAnswer → use teacher_patch.json
    //todo: add transformAnswersToGridSize()
    //todo: add mergeDefectAnswer()

    // For debugging. Need await for getExpPlanCSV
    await this.handleStartButtonClick();
  }

  getAnswer = async () => {
    const res = await axios('./correct_answers.json');
    const data = res.data;
    this.setState({data});
  };

  getMachineCheckResultCsv = async () => {
    const res = await axios('./sample_dropped.csv');
    const csv = res.data;
    this.setState(
      {machineCheckResult: Papa.parse(csv, {header: true})['data']});
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

  getExpPlanCSV = async (expId) => {
    const res = await axios(`./${expId}.csv`);
    const data = await res.data;
    const expPlan = Papa.parse(data, {
      header: true,
      // dynamicTyping: true, //it would make file name change.
    }).data;
    this.setState({expPlan});
  };

  handleExpIdChange = (event) => {
    this.setState({expId: event.target.value}, async () => {
      await this.getExpPlanCSV(this.state.expId).catch(err => console.log(err));
    });
  };

  getListOfFirebaseStorage = async () => {
    storage.ref().child('exp021000001').list().then((res) => {
      const imgFolderPaths = res.prefixes.map((folderRef) => {
        return folderRef.fullPath;
      });
      this.setState({imgFolderPaths});
    });
  };

  getDownloadUrlsOfImgInFolder = async () => {
    storage.ref(this.state.selectedImgFolder).list().then((res) => {
      const downloadUrls = res.items.map(itemRef => {
        return itemRef.getDownloadURL();
      });
      this.setState({downloadUrls});
    });
  };

  handleStartButtonClick = async () => {
    this.setState({isStarted: true});
    await this.getImgPath('SMP');
    await this.generateReferenceToFile();
    this.startTimer();
  };

  getImgPath = async (imgType) => {
    this.setState(previousState => {
      try {
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

  //reference for google cloud storage
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

  startTimer = () => {
    clearInterval(this.timer);
    this.timer = setInterval(this.tick, 1000);
  };

  stopTimer = () => {
    clearInterval(this.timer);
  };

  componentWillUnmount() {
    clearInterval(this.interval);
  }

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

  handleOnRefClick = () => {
    this.setState((prevState) => {
      return {showRef: !prevState.showRef};
    });
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

  handleNextButtonClick = () => {
    this.stopTimer();
    if (this.state.selectedMode === DataCollectionModeStr) {
      this.moveToNextQuestion();
    }

    if (this.state.selectedMode === AnsweringModeStr) {
      switch (this.state.shownView) {
        case 'Question':
          this.setState({shownView: 'Answer'});
          break;
        case 'Answer':
          this.moveToNextQuestion();
          break;
        default:
          break;
      }
    }
  };

  moveToNextQuestion = async () => {
    // deletes data from state non-destructively and prepare for
    // uploading stateWOanswerData
    const {
      data, machineCheckResult, defectTypes,
      expPlan, imageHeight, imageWidth, imgOrder,
      recoveryChoices, ...stateWOanswerData
    } = this.state;
    db.collection('answers_prodcution').add(stateWOanswerData).then(docRef => {
      console.log('Document written with ID: ', docRef.id);
    }).catch(error => {
      console.error('Error adding document: ', error);
    });

    this.initializeForNextQuestion();
    // this.setImgId();
    await this.getImgPath('SMP');
    await this.generateReferenceToFile();
    this.startTimer();

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

  //util functions follow
  handleChange = name => event => {
    this.setState({[name]: event.target.value});
  };

  handleCheckboxChange = name => event => {
    this.setState({[name]: event.target.checked});
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
      imgFolderPaths,
      imgId,
      shownView,
      recoveryText,
      selectedConfidence,
      machineCheckResult,
      pauseTimer,
      expId,
      imgUrlSmp,
      imgUrlRef,
      imgUrlInj,
      showRef,
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
            `選択したタイルを、不良箇所として${nextTxt}へ`];
        }
      } else if (shownView === 'Answer') {
        return [
          'secondary',
          `次へ`];
      }
    })();

    const isDefectTypeChecked = defectTypes.map(
      (defectType) => this.state[defectType],
    ).filter((isChecked) => isChecked).length > 0;

    const isRecoveryActionChecked = recoveryChoices.map(
      (choice) => this.state[choice],
    ).filter((isChecked) => isChecked).length > 0;

    const buttonDisable = (() => {

      if (this.state.timeUsed === 0) {
        return true;
      }

      if (selectedConfidence === 0) {
        return true;
      } else if (clickedAreas.length === 0) { // 確信度がクリックされ、良品判定しようとしている。
        return false;
      }

      if (!isDefectTypeChecked) {
        return true;
      }

      if (clickedAreas.length === 0) {
        return false;
      } else {
        const recoveryAnswered = recoveryText.length > 0 ||
          isRecoveryActionChecked;
        return !recoveryAnswered;
      }

    })();

    const paneDisplay = (() => {
      if (this.state.end) {
        return 'none';
      }
      return this.state.isStarted ? 'block' : 'none';
    })();

    const settingsFormDisabled = this.state.isStarted;

    const menuItems = imgFolderPaths.map((path, index) => {
      return (
        <MenuItem value={path} disabled={settingsFormDisabled}
                  key={index}>{path.replace(
          'exp021000001/', '').replace('___','')}</MenuItem>
      );
    });

    return (
      <JssProvider jss={jss} generateClassName={generateClassName}>

        <div className="App">

          <AppLayoutGrid>
            <LeftPane area='leftPane'>
              <FormControl component="fieldset" className="mode-select">
                <StyledLeftPaneRadioGroup
                  aria-label="mode-select"
                  name="mode-select"
                  className="mode-select"
                  value={this.state.selectedMode}
                  onChange={this.handleChange('selectedMode')}
                >
                  <FormControlLabel value={DataCollectionModeStr}
                                    control={<Radio/>}
                                    label="データ収集モード"
                                    disabled={settingsFormDisabled}/>
                  <FormControlLabel value={AnsweringModeStr}
                                    control={<Radio/>}
                                    label="問題解答モード"
                                    disabled={settingsFormDisabled}/>
                </StyledLeftPaneRadioGroup>
              </FormControl>

              {/*<StyledFormControl>*/}
              {/*  <InputLabel htmlFor="age-simple">実験ID</InputLabel>*/}
              {/*  <Select*/}
              {/*    value={this.state.expId}*/}
              {/*    onChange={this.handleExpIdChange}*/}
              {/*    inputProps={{*/}
              {/*      name: 'expID',*/}
              {/*      id: 'expID',*/}
              {/*    }}*/}
              {/*    disableUnderline={settingsFormDisabled}*/}
              {/*  >*/}
              {/*    <MenuItem value="" disabled={settingsFormDisabled}>*/}
              {/*      <em>None</em>*/}
              {/*    </MenuItem>*/}
              {/*    <MenuItem value={'2-1'}*/}
              {/*              disabled={settingsFormDisabled}>2-1</MenuItem>*/}
              {/*    <MenuItem value={'2-2'}*/}
              {/*              disabled={settingsFormDisabled}>2-2</MenuItem>*/}
              {/*  </Select>*/}
              {/*</StyledFormControl>*/}

              {/*<StyledFormControl>*/}
              {/*  <InputLabel htmlFor="age-simple">被験者ID</InputLabel>*/}
              {/*  <Select*/}
              {/*    value={this.state.subjectId}*/}
              {/*    onChange={this.handleChange('subjectId')}*/}
              {/*    inputProps={{*/}
              {/*      name: 'subjectID',*/}
              {/*      id: 'age-simple',*/}
              {/*    }}*/}
              {/*    disableUnderline={settingsFormDisabled}*/}
              {/*  >*/}
              {/*    <MenuItem value="" disabled={settingsFormDisabled}>*/}
              {/*      <em>None</em>*/}
              {/*    </MenuItem>*/}
              {/*    <MenuItem value={1}*/}
              {/*              disabled={settingsFormDisabled}>1</MenuItem>*/}
              {/*    <MenuItem value={2}*/}
              {/*              disabled={settingsFormDisabled}>2</MenuItem>*/}
              {/*    <MenuItem value={3}*/}
              {/*              disabled={settingsFormDisabled}>3</MenuItem>*/}
              {/*  </Select>*/}
              {/*</StyledFormControl>*/}

              <StyledFormControl>
                <InputLabel>フォルダ</InputLabel>
                <Select
                  value={this.state.selectedImgFolder}
                  onChange={this.handleChange('selectedImgFolder')}
                  inputProps={{
                    name: 'selectedImgFolder',
                    id: 'selectedImgFolder',
                  }}
                  disableUnderline={settingsFormDisabled}
                >
                  {this.state.imgFolderPaths && menuItems}
                </Select>
              </StyledFormControl>

              <StyledFormControl>
                <StyledTextField id="userIdNum"
                                 label="社員番号"
                                 value={this.state.userIdNum}
                                 onChange={this.handleChange(
                                   'userIdNum')}
                />
              </StyledFormControl>


              {this.state.subjectId &&
              <div style={{marginTop: '20px'}}>
                <Button variant="contained"
                        onClick={this.handleStartButtonClick}
                        disabled={settingsFormDisabled}>
                  {'計測を開始'}
                </Button>
              </div>
              }

            </LeftPane>

            <Pane area='centerPane'>

              <ExperimentEndMessage end={this.state.end}
                                    subjectId={this.state.subjectId}/>
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
                      expId === '2-1' &&
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

                  {clickedAreas.length > 0 &&

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


                  <div style={{fontSize: 36}}>
                    {clickedAreas.length > 0 &&
                    <React.Fragment>
                      <Row>
                        <Col xsOffset={4} xs={4}>
                          <h3>判定</h3>
                        </Col>
                      </Row>
                      <FormControl component="fieldset" className="mode-select">
                        {/*<FormLabel component="legend">モード選択</FormLabel>*/}
                        <StyledFlexRadioGroup
                          aria-label="ok-ng-del"
                          row
                          name="ok-ng-del"
                          className="ok-ng-del"
                          value={this.state.selectedOkNgDel}
                          onChange={this.handleChange('selectedOkNgDel')}
                        >
                          <FormControlLabel value={'良品'}
                                            control={<Radio/>}
                                            label="良品"
                          />
                          <FormControlLabel value={'不良（後工程で確認を）'}
                                            control={<Radio/>}
                                            label="不良（後工程で確認を）"
                          />
                          <FormControlLabel value={'不良（後工程で除去を）'}
                                            control={<Radio/>}
                                            label="不良（後工程で除去を）"
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
                    </React.Fragment>
                    }
                    <Row>
                      <Col xsOffset={4} xs={4}>
                        <h3 style={{marginTop: 40}}>判定の確信度</h3>
                      </Col>
                    </Row>
                    <StyledFlexRadioGroup
                      aria-label="ok-ng-del"
                      name="ok-ng-del"
                      row
                      className="ok-ng-del"
                      value={this.state.selectedConfidence}
                      onChange={this.handleChange('selectedConfidence')}
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


                  <div style={{marginTop: 30}}>
                    <Button variant="contained"
                            color={buttonColor}
                            onClick={this.handleNextButtonClick}
                            disabled={buttonDisable}>
                      {buttonText}
                    </Button>
                  </div>

                  {
                    this.state.shownView === 'Answer' &&
                    <div style={{display: 'flex', justifyContent: 'center'}}>
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
                                {this.state.data[nthQuestion]['answers'].join(
                                  ',')}
                              </TableCell>
                              <TableCell align='center'>
                                {this.state.data[nthQuestion]['reason']}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </StyledPaper>
                    </div>
                  }

                </MuiThemeProvider>

              </div>


            </Pane>
          </AppLayoutGrid>
        </div>
      </JssProvider>
    );
  }
}

export default App;


