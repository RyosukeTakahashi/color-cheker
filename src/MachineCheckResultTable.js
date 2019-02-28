import Paper from '@material-ui/core/Paper/Paper';
import Table from '@material-ui/core/Table/Table';
import TableHead from '@material-ui/core/TableHead/TableHead';
import TableRow from '@material-ui/core/TableRow/TableRow';
import TableCell from '@material-ui/core/TableCell/TableCell';
import TableBody from '@material-ui/core/TableBody/TableBody';
import React from 'react';
import styled from 'styled-components';

const StyledPaper = styled(Paper)`
width: 270px;
margin-left: 20px;
`;

export function MachineCheckResultTable({rows}) {

  return (
    <StyledPaper>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>検出領域</TableCell>
            <TableCell align='center'>検出ランク</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.id}>
              <TableCell component="th">
                {row.defectArea}
              </TableCell>
              <TableCell align='center'>{row.defectRank}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </StyledPaper>
  );
}