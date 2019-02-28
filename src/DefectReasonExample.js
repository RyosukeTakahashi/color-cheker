import React, {Component} from 'react';
import * as PropTypes from 'prop-types';
import styled from 'styled-components';

class DefectReasonExample extends Component {
  static propTypes = {
    data: PropTypes.any,
    nthQuestion: PropTypes.number,
  };

  render() {
    return <div className={this.props.className}>
      不良理由の例:{this.props.data[this.props.nthQuestion]['reason']}
    </div>;
  }
}

export const StyledDefectReasonExample = styled(DefectReasonExample)`
margin: 10px;
`;