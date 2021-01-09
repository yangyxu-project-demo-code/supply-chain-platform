var React = require('react');
module.exports = React.createClass({
	getInitialState: function () {
		return {
			data: zn.store.post('/oa/sale/pagingSaleServices', {
				customer_id: this.props.customer
			}),
			items: [
				{ title: '订单编号', name: 'order_code', width: 160, filter: { type: 'Input', opts: ['like'] } },
				{ title: '商品名称', name: 'product_title', width: 220, filter: { type: 'Input', opts: ['like'] } },
				{ title: '客户名称', name: 'customer', width: 280, filter: { type: 'Input', opts: ['like'] } },
				{ title: '收货人', name: 'consignee', width: 120 , filter: { type: 'Input', opts: ['like'] }},
				{ title: '详细地址', name: 'address', width: 560, filter: { type: 'Input', opts: ['like'] } },
				{ title: '手机号', name: 'consignee_telephone', width: 100, filter: { type: 'Input', opts: ['like'] } },
				{ title: '数量', name: 'count', width: 80 },
				{ title: '快递公司', name: 'express_company', width: 230 },
				{ title: '运单号', name: 'express_code', width: 160, filter: { type: 'Input', opts: ['like'] } },
				{ title: '总金额', name: 'sum', width: 100 },
				{ title: '问题描述', name: 'issue_detail', width: 400 },
				{ title: '售后费用', name: 'issue_amount', width: 400 },
				{ title: '处理结果', name: 'issue_result', width: 400 },
				{ title: '备注', name: 'zn_note', width: 400 }
			],
			formItems: [
				{ title: '订单编号', name: 'order_code', type: 'Label' },
				{ title: '客户名称', name: 'customer', type: 'Label' },
				{ title: '收货人', name: 'consignee', type: 'Label' },
				{ title: '详细地址', name: 'address', type: 'Label' },
				{ title: '手机号', name: 'consignee_telephone', type: 'Label' },
				{ title: '数量', name: 'count', type: 'Label' },
				{ title: '总金额', name: 'sum', type: 'Label' },
				{ title: '快递公司', name: 'express_company', type: 'Input' },
				{ title: '运单号', name: 'express_code', type: 'Input' },
				{ title: '问题描述', name: 'issue_detail', type: 'Textarea' },
				{ title: '售后费用', name: 'issue_amount', type: 'Textarea' },
				{ title: '处理结果', name: 'issue_result', type: 'Textarea' },
				{ title: '备注', name: 'zn_note', type: 'Textarea' }
			],
			toolbarItems: [

			]
		}
	},
	__doSuccess: function (){
		this.state.data.refresh();
	},
	__editRow: function (data){
		zn.dialog({
			title: '更新信息',
			content: <zn.react.Form
				merge="updates"
				action='/zn.plugin.admin/table/update'
				exts={{ table: 'zn_workflow_stock_sale_service', where: {id: data.id} }}
				value={zn.store.post('/zn.plugin.admin/table/selectOne', { table: 'zn_workflow_stock_sale_service', where: {id: data.id} })}
				onSubmitSuccess={this.__doSuccess}
				items={this.state.formItems} />
		});
	},
	__onTableColumnRender: function (rowIndex, columnIndex, data, item, value){
		if(item.name=='order_code'){
			return <span>
				<i onClick={()=>this.__editRow(data)} data-tooltip="编辑信息" className="fa fa-edit zr-padding-3" />
				{!!data.zn_plugin_workflow_instance_id ? <a href={zn.react.session.relativeURL('/znpluginworkflow.wfinstance', { instanceId: data.zn_plugin_workflow_instance_id })}><i className="fa fa-random " />{value}</a> :value}
			</span>;
		}

		return value;
	},
	__loadData: function (supplier_id, begin, end){
		this.state.supplier_id = supplier_id==null?this.state.supplier_id:supplier_id;
		this.state.begin = begin==null?this.state.begin:begin;
		this.state.end = end==null?this.state.end:end;
		if(!this.state.supplier_id){
			this.state.supplier_id = null;
		}
		this.state.data.extend({
			supplier_id: this.state.supplier_id,
			begin: this.state.begin,
			end: this.state.end
		}).refresh();
	},
	__search: function (){
		var _supplier_id = this.refs.supplier_id.getValue(),
			_begin = this.refs.begin_time.getValue(),
			_end = this.refs.end_time.getValue();
		this.__loadData(_supplier_id, _begin, _end);
	},
	__downloadAsExcel: function (){
		var _params = {
			customer_id: this.props.customer
		};
		var _supplier_id = this.refs.supplier_id.getValue(),
			_begin = this.refs.begin_time.getValue(),
			_end = this.refs.end_time.getValue();
		if(_supplier_id){
			_params.supplier_id = _supplier_id;
		}
		if(_begin){
			_params.begin = _begin;
		}
		if(_end){
			_params.end = _end;
		}
		zn.react.downloadURL(zn.http.fixURL('/oa/sale/downloadSaleServices?' + zn.querystring.stringify(_params)));
	},
	render:function(){
		return (
			<div className="zn-plugin-workflow-wf-my oa-admin-user-customer-order-details" toolbarItems={this.state.toolbarItems}>
				<zn.react.Group title="过滤" className="page-title" style={{backgroundColor: '#FFF'}}>
					<div className="_item">
						<span className="_key">供应商：</span>
						<div className="_value" style={{display:'flex', alignItems: 'center'}}>
							<zn.SupplierSearcher value={0} ref="supplier_id" data={zn.store.post("/zn.plugin.admin/model/select", {"model": "zn_chunrui_oa_supplier", "fields": "id as value, zn_title as text"})} />
						</div>
					</div>
					<div className="_item">
						<span className="_key">截止时间：</span>
						<div className="_value" style={{display:'flex', alignItems: 'center'}}>
							<zn.react.DateTime ref="begin_time" />
							<span style={{margin: 5}}>--</span>
							<zn.react.DateTime ref="end_time" style={{margin: 5}} />
						</div>
					</div>
					<div className="_item">
						<span className="_key"></span>
						<div className="_value" style={{display:'flex', alignItems: 'center'}}>
							<zn.react.Button onClick={this.__search} text="查询" status="warning" icon="fa-search" style={{width: 100}} />
							<zn.react.Button onClick={this.__downloadAsExcel} text="导出为Excel" status="primary" icon="fa-download" style={{marginLeft: 10, width: 140}} />
						</div>
					</div>
				</zn.react.Group>
				<zn.react.PagerView
					view="Table"
					style={{backgroundColor: '#FFF'}}
					enableFilter={true}
					checkbox={0}
					showHeader={true}
					data={this.state.data}
					columnRender={this.__onTableColumnRender}
					items={this.state.items}/>
			</div>
		);
	}
});
