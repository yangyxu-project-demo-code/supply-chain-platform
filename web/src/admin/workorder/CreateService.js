var React = require('react');
module.exports = React.createClass({
	getInitialState: function () {
		return {
			indexId: 12
		};
	},
	__onCreateSuccess: function (data, wfdata){
		zn.http.post('/zn.plugin.admin/table/update', {
			table: 'zn_workflow_stock_sale_receipt_products',
			updates: {
				status: -1,
				service_wf_instance_id: wfdata.instance_id,
				service_id: wfdata.primary_id
			},
			where: { id: data.id }
		});
	},
	render:function(){
		return (
			<div title='创建销售制单流程' >
				<zn.react.ListView
					style={{width: 200, margin: '10px auto 5px'}}
					className="zr-tab-ios"
					selectMode="radio"
					valueKey="value"
					onClick={(data)=>this.setState({ indexId: data.value })}
					value={this.state.indexId}
					data={[
						{ value: 12, text: '退换货问题' },
						{ value: 16, text: '其他问题' }
					]} />
				<zn.plugin.workflow.CreateInstance baseValue={this.props.data} id={this.state.indexId} onCreateSuccess={(wfdata)=>this.__onCreateSuccess(this.props.data, wfdata)} />
			</div>
		);
	}
});
