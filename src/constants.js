import firebase from 'firebase';
import {firebaseConfig} from './firebase/config';

const firebaseApp = firebase.initializeApp(firebaseConfig);
export const db = firebaseApp.firestore();
export const gridLength = 5;
export const DataCollectionModeStr = 'DataCollection';
export const AnsweringModeStr = 'Answering';
const paneNames = ['leftPane', 'centerPane'];
const paneWidth = ['230px', '1fr'];
export const appLayoutGridTemplate = `
"${paneNames.join(' ')}"
/ ${paneWidth.join(' ')}
`;