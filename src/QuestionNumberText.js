import React from 'react';
import styled from 'styled-components';

const QuestionNumberText = props => {
  return (
      <div className={props.className}>
        Q{props.nthQuestion}
      </div>
  );
};
export const StyledQuestionNumberText = styled(QuestionNumberText)`
margin-top: 20px;
font-size: 30px;
`;