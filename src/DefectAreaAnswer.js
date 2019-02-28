import * as PropTypes from 'prop-types';
import React from 'react';

export function DefectAreaAnswer(props) {
  return <div>
    不良箇所: {props.data[props.nthQuestion]['answers'].join(',')}
  </div>;
}

DefectAreaAnswer.propTypes = {
  data: PropTypes.any,
  nthQuestion: PropTypes.number,
};