import React from 'react';
import {
    Entity,
} from 'aframe-react';

class Grid extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        return (
            <Entity
                id="grid"
                geometry={{
                    primitive: 'plane',
                    width: 1000,
                    height: 1000,
                    segmentsWidth: 100,
                    segmentsHeight: 100,
                }}
                shadow={{
                    receive: false,
                    cast: false,
                }}
                material={{
                    color: 0x000,
                    opacity: 0.2,
                    wireframe: true,
                    transparent: true,
                }}
                position={{ x: 0, y: 0, z: 0 }}
                rotation={{ x: -90, y: 0, z: 0 }}
            />
        );
    }
}

export default Grid;
