var React = require('react');
var SupplierOrderDetails = require('./SupplierOrderDetails.js');

module.exports = React.createClass({
	render:function(){
		return (
			<zn.react.Page title="供应商订单详情">
				<SupplierOrderDetails supplier={this.props.request.search.supplier} />
			</zn.react.Page>
		);
	}
});
