import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {showStandardAlert} from '../reducers/alerts';

let setup = false;

const DIRTY_KEY = 'tw:dirty';

const TWEditorWarningHOC = function (WrappedComponent) {
    class EditorWarningComponent extends React.Component {
        componentDidMount () {
            if (!setup) {
                this.showWarningIfInEditor();
            }
        }
        shouldComponentUpdate () {
            return !setup;
        }
        componentDidUpdate () {
            this.showWarningIfInEditor();
        }
        showWarningIfInEditor () {
            if (!this.props.isPlayerOnly) {
                setup = true;

                // If compiler is already disabled, don't show the warning or change warp timer.
                if (this.props.compilerOptions.enabled) {
                    this.props.onShowWarning();
                    this.props.vm.setCompilerOptions({
                        warpTimer: true
                    });
                }

                // This makes it so that if the VM ever is unable to finish a frame, we may be able to detect it.
                // This isn't foolproof, but it's better than nothing.
                this.props.vm.runtime.beforeStep = () => localStorage.setItem(DIRTY_KEY, '1');
                this.props.vm.runtime.afterStep = () => localStorage.setItem(DIRTY_KEY, '0');

                if (localStorage.getItem(DIRTY_KEY) === '1') {
                    this.props.onShowRecovery();
                }
            }
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                compilerOptions,
                isPlayerOnly,
                onShowWarning,
                onShowRecovery,
                vm,
                /* eslint-enable no-unused-vars */
                ...props
            } = this.props;
            return (
                <WrappedComponent
                    {...props}
                />
            );
        }
    }
    EditorWarningComponent.propTypes = {
        compilerOptions: PropTypes.shape({
            enabled: PropTypes.bool
        }),
        isPlayerOnly: PropTypes.bool,
        onShowWarning: PropTypes.func,
        onShowRecovery: PropTypes.func,
        vm: PropTypes.shape({
            runtime: PropTypes.shape({
                beforeStep: PropTypes.func,
                afterStep: PropTypes.func
            }),
            setCompilerOptions: PropTypes.func
        })
    };
    const mapStateToProps = state => ({
        compilerOptions: state.scratchGui.tw.compilerOptions,
        isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
        vm: state.scratchGui.vm
    });
    const mapDispatchToProps = dispatch => ({
        onShowWarning: () => dispatch(showStandardAlert('twWarning')),
        onShowRecovery: () => dispatch(showStandardAlert('twCrashRecovery'))
    });
    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(EditorWarningComponent);
};

export {
    TWEditorWarningHOC as default
};
