import FormControlLabel
  from '@material-ui/core/FormControlLabel/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox/Checkbox';
import React from 'react';

export const Checkboxes = props => {
  return props.defectTypes.map((defectType, index) => {
    return (
      <FormControlLabel
        control={
          <Checkbox
            // when the component was defined in App Component, I used below.
            // checked={this.state[defectType]}
            // onChange={this.handleCheckboxChange(defectType)}
            checked={props.filteredState[defectType]}
            onChange={props.handleCheckboxChange(defectType)}
            value={defectType}
            key={index}
          />
        }
        label={defectType}
        key={index}
      />
    );
  });
};