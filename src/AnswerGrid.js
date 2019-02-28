import GridTable, * as Area from './GridTable';
import React from 'react';

export const AnswerGrid = (props) => {
  return (
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <GridTable>
          <Area.g0>不良箇所</Area.g0>
          <Area.g1>:</Area.g1>
          <Area.g2>{props.answer}</Area.g2>
          <Area.g3>不良理由の例</Area.g3>
          <Area.g4>:</Area.g4>
          <Area.g5>{props.defectReason}</Area.g5>
        </GridTable>
      </div>
  );
};