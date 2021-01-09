var React = require('react');
var SupplierOrderWFInstance = require('./SupplierOrderWFInstance.js');
module.exports = React.createClass({
	render:function(){
		return (
			<zn.react.Page title="供应商订单流程">
				<SupplierOrderWFInstance supplier={this.props.request.search.supplier} />
			</zn.react.Page>
		);
	}
});
