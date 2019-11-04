import {create} from 'jss';
import {
  createGenerateClassName,
  createMuiTheme,
  jssPreset,
} from '@material-ui/core/styles';
import styled from 'styled-components';
import RadioGroup from '@material-ui/core/RadioGroup';
import Toolbar from '@material-ui/core/Toolbar';
import Paper from '@material-ui/core/Paper';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import FormGroup from '@material-ui/core/FormGroup';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';

import {firebaseConfig} from './firebase/config';

const firebaseApp = firebase.initializeApp(firebaseConfig);
export const db = firebaseApp.firestore();
export const storage = firebase.storage();

export const gridLength = 5;
export const DataCollectionModeStr = 'DataCollection';
export const AnsweringModeStr = 'Answering';
const paneNames = ['leftPane', 'centerPane'];
const paneWidth = ['230px', '1fr'];
export const appLayoutGridTemplate = `
"${paneNames.join(' ')}"
/ ${paneWidth.join(' ')}
`;
export const generateClassName = createGenerateClassName();
export const jss = create({
  ...jssPreset(),
  // We define a custom insertion point that JSS will look for injecting the styles in the DOM.
  insertionPoint: document.getElementById('jss-insertion-point'),
});
export const theme = createMuiTheme({
  overrides: {
    MuiTypography: {
      body1: {
        fontSize: '0.9rem',
        // useNextVariants: true,
      }
    },
  },

});
export const AppLayoutGrid = styled.div`
  display: grid;
  grid-template: ${appLayoutGridTemplate};
`;
export const Pane = styled.div`
  grid-area: ${props => props.area};
`;
export const LeftPane = styled(Pane)`
  border-right-width: medium;
  border-right-style: solid;
  margin-right: 40px;
  padding-right: 15px;
`;
export const StyledPaper = styled(Paper)`
width: 800px;
margin: 100px 0;
`;
export const StyledToolbar = styled(Toolbar)`
  background: aliceblue;
  font-size: 28px;
`;
export const StyledFormControl = styled(FormControl)`
&& {
  min-width: 150px;
  margin-top: 20px;
}
`;
export const StyledTextField = styled(TextField)`
margin-top: -8px;
`;
export const StyledFlexRadioGroup = styled(RadioGroup)`
 justify-content: center;
`;
export const StyledFormGroup = styled(FormGroup)`
  max-width: 900px;
`;

export const StyledLeftPaneRadioGroup = styled(RadioGroup)`
 font-size: 10px;
`;
{/*<label*/}
{/*  className="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-animated MuiInputLabel-shrink MuiFormLabel-filled"*/}
{/*  data-shrink="true">フォルダ</label>*/}

{/*<label*/}
{/*  className="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiFormLabel-filled"*/}
{/*  data-shrink="true" htmlFor="userIdNum" id="userIdNum-label">社員番号</label>*/}