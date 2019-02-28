import React, {Component} from 'react';
import styled from 'styled-components';
import {number, array, func} from 'prop-types';

const GridLayout = styled.div`
  display: grid;
  // width: ${(props) => props.imageWidth}px;
  // height: ${(props) => props.imageHeight}px;
  width: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
  grid-template-columns: repeat(${(props) => props.gridLength}, 1fr);
  background-image: url("https://dummyimage.com/${(props) => `${props.imageWidth}x${props.imageHeight}`}/a8a8a8/fff&text=img${(props) => props.nthQuestion}");
  background-repeat: no-repeat;
  background-size: cover;
`;

const Area = styled.div`
  grid-column: ${props => props.column};
  grid-row: ${props => props.row};
  border: ${props => props.isAreaClicked ? '4px solid red' : '2px dashed blue'};
`;

export default class Squares extends Component {

  static propTypes = {
    gridLength: number.isRequired,
    clickedAreas: array.isRequired,
    onUpdate: func.isRequired,
    nthQuestion: number.isRequired,
  };

  static defaultProps = {
    gridLength: 4,
    clickedAreas: [3, 4],
    onUpdate: (() => ''),
    nthQuestion: 1,
  };

  render() {
    const areas = Array.from({length: this.props.gridLength}).map((_, i) => {
      return Array.from({length: this.props.gridLength}).map((_, j) => {
        const row = i + 1;
        const column = j + 1;
        const nthGrid = i * this.props.gridLength + column;
        const isAreaClicked = this.props.clickedAreas.includes(nthGrid);
        return (
          <Area column={column} row={row} key={nthGrid}
                isAreaClicked={isAreaClicked}
                onClick={this.props.onUpdate(nthGrid)}>
            {nthGrid}
          </Area>
        );
      });

    });

    return (
      <GridLayout
        gridLenth={this.props.gridLength}
        nthQuestion={this.props.nthQuestion}
        imageHeight={this.props.imageHeight}
        imageWidth={this.props.imageWidth}
      >
        {areas}
      </GridLayout>
    );
  }
}