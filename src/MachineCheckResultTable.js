import Paper from '@material-ui/core/Paper/Paper';
import Table from '@material-ui/core/Table/Table';
import TableHead from '@material-ui/core/TableHead/TableHead';
import TableRow from '@material-ui/core/TableRow/TableRow';
import TableCell from '@material-ui/core/TableCell/TableCell';
import TableBody from '@material-ui/core/TableBody/TableBody';
import Toolbar from '@material-ui/core/Toolbar/Toolbar';
import React from 'react';
import styled from 'styled-components';
import * as PropTypes from 'prop-types';

const StyledPaper = styled(Paper)`
margin-left: 20px;
margin-bottom: 30px;
`;

const StyledToolbar = styled(Toolbar)`
background: aliceblue;
`;

export function MachineCheckResultTable(props) {
  const {rows} = props;
  return (
    <StyledPaper>
      <StyledToolbar>
        欠点検出装置の結果
      </StyledToolbar>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell align='center'>X[mm]</TableCell>
            <TableCell align='center'>Y[m]</TableCell>
            <TableCell align='center'>サイズ[mmsq]</TableCell>
            <TableCell align='center'>検出領域</TableCell>
            <TableCell align='center'>検出ランク</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell align='center'>{rows.x}</TableCell>
            <TableCell align='center'>{rows.y}</TableCell>
            <TableCell align='center'>{rows.size}</TableCell>
            <TableCell align='center'>{rows.detectedArea}</TableCell>
            <TableCell align='center'>{rows.rank}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </StyledPaper>
  );
}

MachineCheckResultTable.propTypes = {rows: PropTypes.any};