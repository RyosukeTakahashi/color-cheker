import FormControlLabel
  from '@material-ui/core/FormControlLabel/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox/Checkbox';
import React from 'react';

export const Checkboxes = props => {
  return props.choices.map((choice, index) => {
    return (
      <FormControlLabel
        control={
          <Checkbox
            // when the component was defined in App Component, I used below.
            // checked={this.state[choice]}
            // onChange={this.handleCheckboxChange(choice)}
            checked={props.filteredState[choice]}
            onChange={props.handleCheckboxChange(choice)}
            value={choice}
            key={index}
          />
        }
        label={choice}
        key={index}
      />
    );
  });
};