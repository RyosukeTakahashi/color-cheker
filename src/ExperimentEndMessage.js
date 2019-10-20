import * as PropTypes from 'prop-types';
import React from 'react';

export function ExperimentEndMessage(props) {
  return <div style={{
    display: props.end ? 'flex' : 'none',
    paddingTop: '50%',
  }}>
    ID:{props.subjectId}の方の実験終了です。お疲れ様でした。<br/>
    実験1は40問、実験2は24問あったと思われます。そこに満たずにこれが表示されている場合、実験スタッフにお申し付けください。<br/>
    <br/>
    やり直す場合、ページをF5キーで更新してください。
  </div>;
}

ExperimentEndMessage.propTypes = {
  end: PropTypes.bool,
  subjectId: PropTypes.number,
};