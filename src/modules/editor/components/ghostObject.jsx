import React from 'react';
import { connect } from 'react-redux';
import * as THREE from 'three';
import UUID from 'uuid/v4';

import {
    getIsAddingMode,
    getCurrentObject,
} from '../../../reducers/editor';
import {
    addObject,
    deleteObject,
} from '../../../actions/editor';
import {
    Floor,
    Window,
    Wall,
} from '../components3D';
import getRelativeMouseCoords from '../helper/getRelativeMouseCoords';

type Props = {
    canvas: Object, // eslint-disable-line
    isAddingMode: boolean,
    currentObject: Object,
    addObject: (Object) => void,
    deleteObject: (string) => void,
    renderedObject: Array<Object>
};

@connect(
    store => ({
        isAddingMode: getIsAddingMode(store),
        currentObject: getCurrentObject(store),
    }),
    {
        addObject,
        deleteObject,
    }
)
class GhostObject extends React.Component {
    constructor(props: Props) {
        super(props);
        this.canvas = null;
        this.camera = null;
        this.ghost = null;
        this.mouseDown = false;
        this.shiftDown = false;
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();

        this.state = {
            currentObject: this.props.currentObject,
        };
    }
    componentWillReceiveProps(nextProps: Props) {
        if (!this.canvas && nextProps.canvas) {
            this.canvas = nextProps.canvas;
            this.grid = document.querySelector('#grid');
            this.camera = this.grid.sceneEl.camera;
            this.bindEvent();
        }
        if (nextProps.currentObject !== this.props.currentObject) {
            this.setState({
                currentObject: nextProps.currentObject
            });
        }
    }

    onMouseMove(event: Event) {
        event.preventDefault();
        const relativeMouseCoords = getRelativeMouseCoords(event, this.canvas);
        if (this.props.isAddingMode) {
            this.moveGhostObject(relativeMouseCoords);
        }
    }
    onMouseDbClick(event: Event) {
        event.preventDefault();
        if (this.props.isAddingMode && !this.state.currentObject.notAllowed) {
            this.addObject();
        }
    }

    getPositionStep(gridIntersect: Object) {
        const vector = gridIntersect.point;
        const step = this.state.currentObject.step;
        const objectPosition = gridIntersect.point.clone();
        Object.keys(vector).forEach((coord) => {
            if (coord !== 'y') {
                let n = gridIntersect.point[coord];
                n = Math.ceil(n / step.size) * step.size;
                n = !(n % step.round) ? n + step.size : n;
                if (step.orientation && coord === step.orientation) {
                    n += step.size;
                }
                objectPosition[coord] = n;
            }
        });
        objectPosition.y = this.state.currentObject.position.y;
        return objectPosition;
    }

    checkGhostCollision() {
        const mesh = this.ghost.object3D.children[0];
        if (mesh.geometry) {
            const collidableMeshList = this.props.renderedObject.map((el) => {
                return el.object3D;
            });
            const isCollided = collidableMeshList.some((collidableMesh) => {
                const firstBB = new THREE.Box3()
                    .setFromCenterAndSize(
                        this.ghost.object3D.position,
                        { x: 0.00001, y: 0.00001, z: 0.00001 },
                    );
                const secondBB = new THREE.Box3().setFromObject(collidableMesh);
                return firstBB.intersectsBox(secondBB);
            });
            return isCollided;
        }
        return false;
    }

    moveGhostObject(relativeMouseCoords: Object) {
        const currentObject = this.state.currentObject;
        if (!currentObject) {
            return;
        }
        this.mouse.x = relativeMouseCoords.x;
        this.mouse.y = relativeMouseCoords.y;
        this.raycaster.setFromCamera(this.mouse.clone(), this.camera);

        const gridIntersect = this.raycaster.intersectObject(this.grid.object3D, true)[0];
        if (gridIntersect) {
            currentObject.position = this.getPositionStep(gridIntersect);

            const objectToRemove = (this.props.renderedObject) ? this.props.renderedObject.find((item3d) => {
                if (item3d.getAttribute('type') === currentObject.type) {
                    return item3d.object3D.position.equals(currentObject.position);
                }
                return false;
            }) : [];

            currentObject.notAllowed = this.checkGhostCollision() || objectToRemove;

            this.setState({
                currentObject,
            }, () => {
                if (this.mouseDown && !this.state.currentObject.notAllowed && !this.shiftDown) {
                    this.addObject();
                }
                if (this.mouseDown && this.state.currentObject.notAllowed && this.shiftDown) {
                    if (objectToRemove) {
                        this.deleteObject(objectToRemove.getAttribute('uuid'));
                    }
                }
            });
        }
    }

    rotateGhostObject() {
        const currentObject = this.state.currentObject;
        if (currentObject && this.props.isAddingMode) {
            const currentDegree = currentObject.rotation.y;
            const degreeY = (currentDegree > 0) ? 0 : 90;
            this.setState({
                currentObject: {
                    ...currentObject,
                    rotation: new THREE.Vector3(0, degreeY, 0),
                }
            });
        }
    }

    addObject() {
        const uuid = UUID();
        this.props.addObject({
            ...this.state.currentObject,
            uuid,
        });
    }

    deleteObject(uuid) {
        this.props.deleteObject(uuid);
    }

    bindEvent() {
        this.canvas.addEventListener('mousemove', (event) => {
            this.onMouseMove(event);
        }, false);
        this.canvas.addEventListener('dblclick', () => {
            this.onMouseDbClick(event);
        }, false);
        this.canvas.addEventListener('mousedown', () => {
            this.mouseDown = true;
        }, false);
        this.canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
        }, false);
        window.addEventListener('keydown', () => {
            // shift
            if (event.keyCode === 16) {
                this.shiftDown = true;
            }
            // r - rotate
            if (event.keyCode === 82) {
                this.rotateGhostObject();
            }
        }, false);
        window.addEventListener('keyup', () => {
            // shift
            if (event.keyCode === 16) {
                this.shiftDown = false;
            }
        }, false);
    }

    render() {
        const currentObject = this.state.currentObject;
        if (this.props.isAddingMode && currentObject !== null) {
            if (currentObject.type === 'FLOOR') {
                return (
                    <Floor
                        uuid={currentObject.uuid}
                        position={currentObject.position}
                        rotation={currentObject.rotation}
                        _onRef={(item) => {
                            this.ghost = item;
                        }}
                        notAllowed={currentObject.notAllowed}
                    />
                );
            }
            if (currentObject.type === 'WINDOW') {
                return (
                    <Window
                        uuid={currentObject.uuid}
                        position={currentObject.position}
                        rotation={currentObject.rotation}
                        _onRef={(item) => {
                            this.ghost = item;
                        }}
                        notAllowed={currentObject.notAllowed}
                    />
                );
            }
            if (currentObject.type === 'WALL') {
                return (
                    <Wall
                        uuid={currentObject.uuid}
                        position={currentObject.position}
                        rotation={currentObject.rotation}
                        _onRef={(item) => {
                            this.ghost = item;
                        }}
                        notAllowed={currentObject.notAllowed}
                    />
                );
            }
        }
        return null;
    }
}

export default GhostObject;
