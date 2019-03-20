import React from 'react';
import styled from 'styled-components';

const CorrectOrWrong = props => {
  /** @namespace props.isCorrect */
  return (
      <div className={props.className}>
        {props.isCorrect ? '正解です' : '不正解です'}
      </div>
  );
};
export const StyledCorrectOrWrong = styled(CorrectOrWrong)`
//margin: 10px;
color: ${props => props.isCorrect ? 'green' : 'red'};
//font-size: 18px;
`;