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
  // grid-template-columns: repeat(${(props) => props.gridLength}, 1fr);
  background-image: url(${props=>props.imgUrl});
  background-repeat: no-repeat;
  background-size: cover;
`;


export default class RefOrInj extends Component {

  state = {showRef: true};

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

  handleOnClick = () => {
    this.setState((prevState) =>{
      return {showRef: !prevState.showRef}
    });
  };

  render() {

    const imgUrl = this.state.showRef ? this.props.imgUrlInj:this.props.imgUrlRef ;

    return (
      <GridLayout
        gridLenth={this.props.gridLength}
        imgUrl={imgUrl}
        imageHeight={this.props.imageHeight}
        imageWidth={this.props.imageWidth}
        onClick={this.handleOnClick}
      >
      </GridLayout>
    );
  }
}