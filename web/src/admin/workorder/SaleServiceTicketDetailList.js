var React = require('react');
module.exports = React.createClass({
	getInitialState: function () {
		return {
			data: zn.store.post('/oa/sale/pagingSaleServices', {
				zn_plugin_workflow_instance_id: this.props.request.search.wf_id
			}),
			items: [
				{ title: '订单编号', name: 'order_code', width: 160, filter: { type: 'Input', opts: ['like'] } },
				{ title: '提交时间', name: 'zn_create_time', width: 140, filter: { type: 'Input', opts: ['like'] } },
				{ title: '客户', name: 'customer', width: 200, filter: { type: 'Input', opts: ['like'] } },
				{ title: '供应商', name: 'supplier', width: 200, filter: { type: 'Input', opts: ['like'] } },
				{ title: '商品名称', name: 'product_title', width: 220, filter: { type: 'Input', opts: ['like'] } },
				{ title: '收货人', name: 'consignee', width: 120 , filter: { type: 'Input', opts: ['like'] }},
				{ title: '详细地址', name: 'address', width: 560, filter: { type: 'Input', opts: ['like'] } },
				{ title: '手机号', name: 'consignee_telephone', width: 100, filter: { type: 'Input', opts: ['like'] } },
				{ title: '数量', name: 'count', width: 80 },
				{ title: '单价', name: 'price', width: 80 },
				{ title: '总价', name: 'total_sum', width: 100 },
				{ title: '快递公司', name: 'express_company', width: 230, filter: { type: 'Input', opts: ['like'] } },
				{ title: '快递单号', name: 'express_code', width: 160, filter: { type: 'Input', opts: ['like'] } },
				{ title: '快递金额', name: 'express_sum', width: 100 },
				{ title: '问题描述', name: 'issue_detail', width: 400 },
				{ title: '售后费用', name: 'issue_amount', width: 400 },
				{ title: '处理结果', name: 'issue_result', width: 400 },
				{ title: '备注', name: 'zn_note', width: 400 }
			],
			formItems: [
				{ title: '客户', name: 'customer', type: 'Label' },
				{ title: '供应商', name: 'customer', type: 'Label' },
				{ title: '订单编号', name: 'order_code', type: 'Label' },
				{ title: '商品名称', name: 'order_code', type: 'Label' },
				{ title: '收货人', name: 'consignee', type: 'Label' },
				{ title: '详细地址', name: 'address', type: 'Label' },
				{ title: '收货人手机', name: 'consignee_telephone', type: 'Label' },
				{ title: '收货人电话', name: 'consignee_phone', type: 'Label' },
				{ title: '数量', name: 'count', type: 'Label' },
				{ title: '单价', name: 'price', type: 'Label' },
				{ title: '总价', name: 'total_sum', type: 'Label' },
				{ title: '快递公司', name: 'express_company', type: 'Input' },
				{ title: '快递单号', name: 'express_code', type: 'Input' },
				{ title: '快递金额', name: 'express_sum', type: 'Label' },
				{ title: '问题描述', name: 'issue_detail', type: 'Textarea' },
				{ title: '售后费用', name: 'issue_amount', type: 'Textarea' },
				{ title: '处理结果', name: 'issue_result', type: 'Textarea' },
				{ title: '备注', name: 'zn_note', type: 'Textarea' }
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
	__loadData: function (supplier_id, customer_id, begin, end){
		this.state.supplier_id = supplier_id==null?this.state.supplier_id:supplier_id;
		this.state.customer_id = customer_id==null?this.state.customer_id:customer_id;
		this.state.begin = begin==null?this.state.begin:begin;
		this.state.end = end==null?this.state.end:end;
		var _data = {};
		if(this.state.supplier_id){
			_data.supplier_id = this.state.supplier_id;
		}else {
			this.state.supplier_id = null;
		}
		if(this.state.customer_id){
			_data.customer_id = this.state.customer_id;
		}else {
			this.state.customer_id = null;
		}
		if(this.state.begin){
			_data.begin = this.state.begin;
		}
		if(this.state.end){
			_data.end = this.state.end;
		}
		this.state.data.extend(_data).refresh();
	},
	__search: function (){
		var _supplier_id = this.refs.supplier_id.getValue(),
			_customer_id = this.refs.customer_id.getValue(),
			_begin = this.refs.begin_time.getValue(),
			_end = this.refs.end_time.getValue();
		this.__loadData(_supplier_id, _customer_id, _begin, _end);
	},
	__downloadAsExcel: function (){
		var _params = {};
		var _supplier_id = this.refs.supplier_id.getValue(),
			_customer_id = this.refs.customer_id.getValue(),
			_begin = this.refs.begin_time.getValue(),
			_end = this.refs.end_time.getValue();
		if(_supplier_id){
			_params.supplier_id = _supplier_id;
		}
		if(_customer_id){
			_params.customer_id = _customer_id;
		}
		if(_begin){
			_params.begin = _begin;
		}
		if(_end){
			_params.end = _end;
		}
		zn.react.downloadURL(zn.http.fixURL('/oa/sale/downloadSaleServices?' + zn.querystring.stringify(_params)));
	},
	__cancel: function (){
		this.refs.customer_id.setValue('');
		this.refs.supplier_id.setValue('');
		this.refs.begin_time.setValue('');
		this.refs.end_time.setValue('');
		this.state.supplier_id = null;
		this.state.customer_id = null;
		this.state.begin = null;
		this.state.end = null;
		this.__loadData();
	},
	render:function(){
		return (
			<zn.react.Page title='退换货售后单据列表' className="zn-plugin-workflow-wf-my oa-admin-user-customer-order-details" toolbarItems={this.state.toolbarItems}>
				<zn.react.Group title="过滤" className="page-title" style={{backgroundColor: '#FFF'}}>
					<div className="_item">
						<span className="_key">客户：</span>
						<div className="_value" style={{display:'flex', alignItems: 'center'}}>
							<zn.react.Select value={0} ref="customer_id" data={zn.store.post("/zn.plugin.admin/model/select", {"model": "zn_chunrui_oa_customer", "fields": "id as value, zn_title as text"})} />
						</div>
					</div>
					<div className="_item">
						<span className="_key">供应商：</span>
						<div className="_value" style={{display:'flex', alignItems: 'center'}}>
							<zn.react.Select value={0} ref="supplier_id" data={zn.store.post("/zn.plugin.admin/model/select", {"model": "zn_chunrui_oa_supplier", "fields": "id as value, zn_title as text"})} />
						</div>
					</div>
					<div className="_item">
						<span className="_key">截止时间：</span>
						<div className="_value" style={{display:'flex', alignItems: 'center'}}>
							<zn.react.Input ref="begin_time" attrs={{type:'date'}} />
							<span style={{margin: 5}}>--</span>
							<zn.react.Input ref="end_time" attrs={{type:'date'}}  style={{margin: 5}} />
							<zn.react.Button onClick={this.__search} text="查询" status="warning" icon="fa-search" style={{width: 100}} />
							<zn.react.Button onClick={()=>this.__cancel()} text="取消过滤" status="danger" icon="fa-remove" style={{marginLeft: 10, width: 100}} />
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
			</zn.react.Page>
		);
	}
});
