import React, { Component } from 'react'
import { pingGateway } from '../../../helpers/HostedEngineSetupUtil'
import { validatePropsForUiStage, getErrorMsgForProperty } from '../Validation'
import { defaultInterfaces, messages, status as gwState } from '../constants'
import HeWizardNetwork from './HeWizardNetwork'

class HeWizardNetworkContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            networkConfig: props.heSetupModel.network,
            errorMsg: "",
            errorMsgs: {},
            gatewayState: gwState.EMPTY,
            interfaces: defaultInterfaces
        };

        this.checkGatewayPingability = this.checkGatewayPingability.bind(this);
        this.setDefaultValues = this.setDefaultValues.bind(this);
        this.handleNetworkConfigUpdate = this.handleNetworkConfigUpdate.bind(this);
        this.validateConfigUpdate = this.validateConfigUpdate.bind(this);
        this.validateAllInputs = this.validateAllInputs.bind(this);
    }

    componentWillMount() {
        this.setDefaultValues();
    }

    checkGatewayPingability(address) {
        let errorMsg = this.state.errorMsg;
        errorMsg = "";

        let errorMsgs = this.state.errorMsgs;
        errorMsgs.gateway = "";

        let gatewayState = this.state.gatewayState;
        gatewayState = gwState.POLLING;

        this.setState({ gatewayState, errorMsg, errorMsgs });

        let self = this;
        pingGateway(address)
            .done(function() {
                gatewayState = gwState.SUCCESS;
                self.setState({ errorMsg, gatewayState });
            })
            .fail(function() {
                errorMsg = messages.GENERAL_ERROR_MSG;
                errorMsgs.gateway = messages.IP_NOT_PINGABLE;
                gatewayState = gwState.FAILED;
                self.setState({ errorMsg, errorMsgs, gatewayState });
            });
    }

    setDefaultValues() {
        const defaultsProvider = this.props.defaultsProvider;

        this.setState({ interfaces: defaultsProvider.getNetworkInterfaces() });
        this.handleNetworkConfigUpdate("bridgeName", defaultsProvider.getDefaultInterface());
        this.handleNetworkConfigUpdate("gateway", defaultsProvider.getDefaultGateway());
    }

    handleNetworkConfigUpdate(property, value) {
        const networkConfig = this.state.networkConfig;
        networkConfig[property].value = value;
        this.setState({ networkConfig });
        this.validateConfigUpdate(property, networkConfig);
    }

    validateConfigUpdate(propName, config) {
        let errorMsg = this.state.errorMsg;
        const errorMsgs = {};
        const prop = config[propName];
        const propErrorMsg = getErrorMsgForProperty(prop);

        if (propErrorMsg !== "") {
            errorMsgs[propName] = propErrorMsg;
        } else {
            errorMsg = "";
        }

        if (propName === "gateway" && propErrorMsg === "") {
            this.checkGatewayPingability(prop.value);
        }

        this.setState({ errorMsg, errorMsgs });
    }

    validateAllInputs() {
        let errorMsg = "";
        let errorMsgs = {};
        let propsAreValid = validatePropsForUiStage("Network", this.props.heSetupModel, errorMsgs) ||
            this.state.gatewayState === gwState.FAILED;

        if (!propsAreValid) {
            errorMsg = messages.GENERAL_ERROR_MSG;
        }

        this.setState({ errorMsg, errorMsgs });
        return propsAreValid;
    }

    shouldComponentUpdate(nextProps, nextState){
        if(!this.props.validating && nextProps.validating){
            this.props.validationCallBack(this.validateAllInputs())
        }

        return true;
    }

    render() {
        return <HeWizardNetwork
                errorMsg={this.state.errorMsg}
                errorMsgs={this.state.errorMsgs}
                gatewayState={this.state.gatewayState}
                interfaces={this.state.interfaces}
                networkConfig={this.state.networkConfig}
                handleNetworkConfigUpdate={this.handleNetworkConfigUpdate}
                />
    }
}

HeWizardNetworkContainer.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    heSetupModel: React.PropTypes.object.isRequired
};

export default HeWizardNetworkContainer