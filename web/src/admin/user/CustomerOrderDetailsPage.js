var React = require('react');
var CustomerOrderDetails = require('./CustomerOrderDetails.js');

module.exports = React.createClass({
	render:function(){
		return (
			<zn.react.Page title="客户订单详情">
				<CustomerOrderDetails customer={this.props.request.search.customer} />
			</zn.react.Page>
		);
	}
});
