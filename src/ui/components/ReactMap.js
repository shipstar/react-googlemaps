"use strict";

var React = require('react');
var cloneWithProps = require('react/lib/cloneWithProps');
var keyMirror = require('react/lib/keyMirror');
var ReactMapComponents = require('../../ReactMapComponents');
var MapPropTypes = require('../MapPropTypes');
var PropTypeUtils = require('../../utils/PropTypeUtils');
var ReactFrag = require('./ReactFrag');

var GoogleMapsMap = ReactMapComponents.Map;

// TODO: Remove the need for this, we shouldn't need to render 3 times to initialise
var MapLifeCycle = keyMirror({
  CREATING_HOLDER: null,
  CREATING_MAP: null
});

var fitOnce = true;

var ReactMap = React.createClass({
  propTypes: {
    zoom: PropTypeUtils.or('initialZoom', React.PropTypes.number).isRequired,
    center: PropTypeUtils.or('initialCenter', MapPropTypes.LatLng).isRequired,
    width: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
    height: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string])
  },

  getInitialState: function() {
    return {
      mapLifeCycleState: MapLifeCycle.CREATING_HOLDER
    };
  },

  componentDidMount: function() {
    // Now we have the map created, we need to run the render
    // cycle again to pass down the `map` holder for the
    // components to render into.
    this.setState({mapLifeCycleState: MapLifeCycle.CREATING_MAP});
  },

  componentDidUpdate: function() {
    if (this.state.mapLifeCycleState === MapLifeCycle.CREATING_MAP) {
      this.setState({mapLifeCycleState: null});
    }
  },

  componentWillReceiveProps: function(nextProps) {
    if (!(this.props.bounds && nextProps.bounds)) { return; }

    var boundsEqual = function (oldProps, newProps) {
      return oldProps.bounds.getSouthWest().lat() === newProps.bounds.getSouthWest().lat() &&
             oldProps.bounds.getSouthWest().lng() === newProps.bounds.getSouthWest().lng() &&
             oldProps.bounds.getNorthEast().lat() === newProps.bounds.getNorthEast().lat() &&
             oldProps.bounds.getNorthEast().lng() === newProps.bounds.getNorthEast().lng()
    };

    if (!this.state.mapLifeCycleState && this.refs.map.__node && (!boundsEqual(this.props, nextProps) || fitOnce)) {
      this.refs.map.__node.fitBounds(nextProps.bounds)
      fitOnce = false;
      this.forceUpdate()
    }
  },

  render: function() {
    var holderStyle = {
      width: this.props.width,
      height: this.props.height
    };

    var map;
    if (this.state.mapLifeCycleState !== MapLifeCycle.CREATING_HOLDER) {
      map = (
        <GoogleMapsMap
          {...this.props}
          ref="map"
          mapDiv={this.refs.mapHolder.getDOMNode()}
          width={null}
          height={null} />
      );
    }

    var children;
    if (!this.state.mapLifeCycleState) {
      children = (
        <ReactFrag map={this.refs.map.__node}>
          {this.props.children}
        </ReactFrag>
      );
    }

    return (
      <div>
        <div
          ref="mapHolder"
          className={this.props.className}
          style={holderStyle} />

        {map}
        {children}
      </div>
      );
  }
});

module.exports = ReactMap;
