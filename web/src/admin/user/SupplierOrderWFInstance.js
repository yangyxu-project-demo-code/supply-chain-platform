var React = require('react');
module.exports = React.createClass({
	getInitialState: function () {
		return {
			data: zn.store.post('/oa/supplier/orders', { supplier: this.props.supplier }),
			items: [
				{ title: '单号', name: 'code', width: 150, filter: { type: 'Input', opts: ['like'] } },
				{ title: '状态', name: 'state', width: 80 },
				{ title: '供应商', name: 'supplier_convert', width: 200 },
				{ title: '入库仓', name: 'in_warehouse_convert', width: 120 },
				{ title: '当前节点', name: 'current_state', width: 120 },
				{ title: '申请人', name: 'zn_create_user_convert', width: 100 },
				{ title: '申请时间', name: 'zn_create_time', width: 130 },
				{ title: '操作时间', name: 'zn_modify_time', width: 130 },
				{ title: '说明', name: 'zn_note', filter: { type: 'Input', opts: ['like'] } }
			]
		}
	},
	__onTableColumnRender: function (rowIndex, columnIndex, data, item, value){
		if(!data.code){
			return null;
		}
		switch (item.name) {
			case 'code':
				return <a data-tooltip={data.closed?'已关闭':''} style={{color:(data.closed?'#919191':null)}} href={'#'+zn.react.session.fixPath('/znpluginworkflow.wfinstance')+'?instanceId=' + data.wfi_id}>{value}</a>;
			case 'state':
				switch (value) {
					case 1:
						return <span className="status" style={{backgroundColor: '#f0ad4e'}}>待处理</span>;
					case -1:
						return <span className="status" style={{backgroundColor: '#6def55'}}>已结束</span>;
					case -2:
						return <span className="status" style={{backgroundColor: '#dad8d8'}}>已取消</span>;
					case 2:
						return <span className="status" style={{backgroundColor: '#0d8c06'}}>已审核</span>;
				}
				break;
		}
	},
	render:function(){
		return (
			<zn.react.PagerView
				view="Table"
				className="zn-plugin-workflow-wf-my"
				enableFilter={true}
				showHeader={true}
				columnRender={this.__onTableColumnRender}
				data={this.state.data}
				items={this.state.items}/>
		);
	}
});
