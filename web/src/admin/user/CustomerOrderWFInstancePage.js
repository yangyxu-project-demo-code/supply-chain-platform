var React = require('react');
var CustomerOrderWFInstance = require('./CustomerOrderWFInstance.js');
module.exports = React.createClass({
	render:function(){
		return (
			<zn.react.Page title="客户订单流程">
				<CustomerOrderWFInstance customer={this.props.request.search.customer} />
			</zn.react.Page>
		);
	}
});
