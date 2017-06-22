// import autobind from 'autobind-decorator';
import React from 'react';
import React3 from 'react-three-renderer';
import * as THREE from 'three';
import { connect } from 'react-redux';

import { getAddingCube } from '../../../reducers/editor';

import Lights from './Lights';
import Floor from './Floor';
import OrtographicCamera from './OrtographicCamera';
import PerspectiveCamera from './PerspectiveCamera';

type Props = {
    width: number,
    height: number,
    isAddingCube: boolean,
};

@connect(
    store => ({
        isAddingCube: getAddingCube(store),
    }),
)
class Canvas extends React.Component {
    constructor(props: Props) {
        super(props);
        this.state = {
            isAddingCube: this.props.isAddingCube,
        };
    }

    render() {
        const fog = new THREE.Fog(0xcce0ff, 500, 10000);
        return (
            <React3
                antialias
                mainCamera="camera"
                width={this.props.width}
                height={this.props.height}
                shadowMapEnabled
                clearColor={fog.color}
            >
                <scene
                    fog={fog}
                >
                    <Lights />
                    <Floor />
                    <OrtographicCamera
                        name="camera"
                        width={this.props.width}
                        height={this.props.height}
                    />
                    <PerspectiveCamera
                        isActive={false}
                        name="cameraxx"
                        width={this.props.width}
                        height={this.props.height}
                    />
                </scene>
            </React3>
        );
    }
}

export default Canvas;
