var React = require('react');
var COLORS = {
	'0': '#3498db',
	'1': '#f1ad4d',
	'2': '#d9534f'
}

module.exports = React.createClass({
	getInitialState: function () {
		return {
			data: zn.store.post('/oa/sale/getCustomerProductList', { customer_id: this.props.customer }),
			items: [
				{ title: '提交时间', name: 'zn_create_time', width: 160, filter: { type: 'Input', opts: ['like'] } },
				{ title: '客户名称', name: 'customer', width: 280, filter: { type: 'Input', opts: ['like'] } },
				{ title: '收货人', name: 'consignee', width: 100 , filter: { type: 'Input', opts: ['like'] }},
				{ title: '收货人电话', name: 'consignee_telephone', width: 140, filter: { type: 'Input', opts: ['like'] } },
				{ title: '详细地址', name: 'address', width: 420, filter: { type: 'Input', opts: ['like'] } },
				{ title: '商品名称', name: 'product_model', convert: 'product_title', width: 220, filter: { type: 'Input', opts: ['like'] } },
				{ title: '数量', name: 'count', width: 100 },
				{ title: '出库仓', name: 'out_warehouse', convert: 'warehouse', width: 180 },
				{ title: '快递单号', name: 'express_code', width: 180, filter: { type: 'Input', opts: ['like'] } },
				{ title: '单价', name: 'price', width: 100 },
				{ title: '总金额', name: 'total_sum', width: 100 },
				{ title: '快递公司', name: 'express_company', width: 180 },
				{ title: '快递费', name: 'express_sum', width: 100 },
				{ title: '快递状态', name: 'express_state', width: 140 },
				{ title: '备注', name: 'remark', width: 480 },
				{ title: '订单编号', name: 'order_code', width: 200, filter: { type: 'Input', opts: ['like'] } },
				{ title: '操作', name: 'action', width: 280, textAlign: 'center' },
				{ title: '优先级', name: 'priority', width: 100, filter: { type: 'Select', style: { textAlignLast: 'right' }, value: -1, opts: ['='], data: [{text:"非常紧急", value: 2}, {text:"紧急", value: 1}, { text:"正常", value: 0 }] } },
				{ title: '开票状态', name: 'invoice_id', width: 100 }
			]
		}
	},
	__downloadAsExcel: function (){
		var _params = {
			customer_id: this.props.customer
		};
		var _status = this.refs.status.getValue(),
			_begin = this.refs.begin_time.getValue(),
			_end = this.refs.end_time.getValue();
		if(_status){
			_params.status = _status;
		}
		if(_begin){
			_params.begin = _begin;
		}
		if(_end){
			_params.end = _end;
		}
		zn.react.downloadURL(zn.http.fixURL('/oa/sale/downloadCustomerProductList?' + zn.querystring.stringify(_params)));
	},
	__onImportDataComplete: function (){
		this.state.data.refresh();
	},
	__onCreateSuccess: function (data, wfdata, table){
		zn.http.post('/zn.plugin.admin/table/update', {
			table: 'zn_workflow_stock_sale_receipt_products',
			updates: {
				status: -1,
				service_wf_instance_id: wfdata.instance_id,
				service_id: wfdata.primary_id,
				service_table: table
			},
			where: { id: data.id }
		});
	},
	__deleteItem: function (data) {
		var _self = this;
		zn.confirm('作废订单, 该商品库存将回到出库仓,确定作废吗？','提示', function (){
			zn.http.post('/oa/stock/backReceiptItem', {
				item_id: data.id
			}).then(function (data){
				if(data.status==200){
					zn.notification.success('作废成功！');
					_self.state.data.refresh()
				}else {
					zn.notification.error(data.result);
				}
			}, function (){
				zn.notification.error('网络请求失败');
			});
		});
	},
	__backItem: function (data){
		data.count = +data.count;
		if(data.count){
			zn.dialog({
				title: '退回仓库',
				content: <div>
					<div className="zn-note" style={{margin: 6}}>注：发起退仓订单数量和对应出库仓库存将同时发生变化。</div>
					<zn.react.Form
						action='/oa/stock/backReceiptItem'
						exts={{ item_id: data.id }}
						onSubmitBefore={(value)=>{
							if(value.count>data.count){
								return zn.notification.error('退仓数量不能超过' + data.count + '个'), false;
							}
						}}
						onSubmitSuccess={()=>this.state.data.refresh()}
						items={[{title: '退回数量', type: 'Input', value: 1, name: 'count', attrs: { min: 1, type: 'number', max: +data.count } }]} />
				</div>
			});
		}
	},
	__trashItem: function (data){
		var _self = this;
		zn.confirm('作废订单, 该订单将不可恢复, 确定作废？','提示', function (){
			zn.http.post('/oa/stock/backReceiptItemWithoutStock', {
				item_id: data.id
			}).then(function (data){
				if(data.status==200){
					zn.notification.success('作废成功！');
					_self.state.data.refresh()
				}else {
					zn.notification.error(data.result);
				}
			}, function (){
				zn.notification.error('网络请求失败');
			});
		});
	},
	__backItemWithoutStock: function (data){
		data.count = +data.count;
		if(data.count){
			zn.dialog({
				title: '修改数量',
				content: <div>
					<div className="zn-note" style={{margin: 6}}>注：流程未完成修改订单数量暂时不会影响仓库库存量, 但数量不能少于1个。</div>
					<zn.react.Form
						action='/oa/stock/backReceiptItemWithoutStock'
						exts={{ item_id: data.id }}
						onSubmitBefore={(value)=>{
							if(value.count<1){
								return zn.notification.error('数量不能少于1个'), false;
							}
						}}
						onSubmitSuccess={()=>this.state.data.refresh()}
						items={[{title: '数量', value: data.count, type: 'Input', name: 'count', attrs: { min: 1, type: 'number' } }]} />
				</div>
			});
		}
	},
	__updateExpress: function (data){
		zn.dialog({
			title: '更新物流/快递信息',
			content: <div>
				<div className="zn-note" style={{margin: 6}}>注：更新完快递单号, 需要重新更新快递物流信息。</div>
				<zn.react.Form
					action='/zn.plugin.admin/table/update'
					exts={{ table: 'zn_workflow_stock_sale_receipt_products', where: { id: data.id } }}
					merge="updates"
					hiddens={{ express_state: -1, express_data: '{}' }}
					value={data}
					onSubmitSuccess={()=>this.state.data.refresh()}
					items={[
						{title: '快递公司', type: 'Input', required: true, name: 'express_company' },
						{title: '快递单号', type: 'Input', required: true, name: 'express_code' },
						{title: '快递费', type: 'Input', name: 'express_sum', attrs: {type: 'number'}, suffix: '人民币' },
						// {title: '备注', type: 'Textarea', name: 'zn_note' }
					]} />
			</div>
		});
	},
	__updateRemark: function (data){
		zn.dialog({
			title: '添加/修改备注',
			content: <div>
				<div className="zn-note" style={{margin: 6}}>注：添加/修改订单或者快递备注信息</div>
				<zn.react.Form
					action='/zn.plugin.admin/table/update'
					exts={{ table: 'zn_workflow_stock_sale_receipt_products', where: { id: data.id } }}
					merge="updates"
					value={data}
					onSubmitSuccess={()=>this.state.data.refresh()}
					items={[
						{title: '备注', type: 'Textarea', name: 'remark' }
					]} />
			</div>
		});
	},
	__refreshExpress: function (data){
		zn.preloader.open({title: '正在刷新中...'});
		zn.http.post('/oa/express/updateExpressInfo', {
			sale_receipt_order_id: data.id
		}).then(function (data){
			if(data.status==200){
				zn.notification.success('刷新成功！');
				this.state.data.refresh()
			}else {
				zn.notification.error(data.result);
			}
			zn.preloader.close();
		}.bind(this), function (){
			zn.notification.error('网络请求失败');
			zn.preloader.close();
		});
	},
	__showExpressDetail: function (data){
		zn.dialog({
			title: data.express_company + ' - ' + data.express_code + ' 物流详情',
			content: <zn.react.ExpressDetail {...JSON.parse(data.express_data)} />
		});
	},
	__returnService: function (data){
		zn.http.post('/zn.plugin.admin/table/selectOne', {
			table: 'zn_workflow_stock_sale_receipt',
			where: {
				id: data.zn_plugin_workflow_primary_id
			}
		}).then(function (_return){
			var _data = _return.result;
			data.customer_id = +_data.customer;
			data.back_warehouse = data.out_warehouse;
			data.sale_receipt_id = data.id;
			data.express_sum = data.express_sum||0;
			zn.dialog({
				title: '发起退换货售后',
				content: <zn.plugin.workflow.CreateInstance baseValue={data} id={12} onCreateSuccess={(wfdata)=>this.__onCreateSuccess(data, wfdata, 'zn_workflow_stock_sale_service')} />
			});
		}.bind(this));
	},
	__otherService: function (data){
		zn.http.post('/zn.plugin.admin/table/selectOne', {
			table: 'zn_workflow_stock_sale_receipt',
			where: {
				id: data.zn_plugin_workflow_primary_id
			}
		}).then(function (_return){
			var _data = _return.result;
			data.customer_id = +_data.customer;
			data.back_warehouse = data.out_warehouse;
			data.sale_receipt_id = data.id;
			data.express_sum = data.express_sum||0;
			zn.dialog({
				title: '发起其他售后',
				content: <zn.plugin.workflow.CreateInstance baseValue={data} id={16} onCreateSuccess={(wfdata)=>this.__onCreateSuccess(data, wfdata, 'zn_workflow_stock_sale_service_other')} />
			});
		}.bind(this));
	},
	__onPriorityChange: function (value, data){
		zn.http.post('/zn.plugin.admin/table/update', {
			table: 'zn_workflow_stock_sale_receipt_products',
			updates: {
				priority: value.value
			},
			where: { id: data.id }
		}).then(function (data){
			if(data.status==200){
				this.state.data.refresh();
			}else {
				zn.notification.error(data.result);
			}
		}.bind(this), function (){
			zn.notification.error('网络请求失败');
		});
	},
	__onTableColumnRender: function (rowIndex, columnIndex, data, item, value){
		data.status = +data.status;
		switch (item.name) {
			case 'invoice_id':
				return !!value?<span style={{color: 'green'}}><i className="fa fa-check-circle-o zr-padding-3" />已开</span>:<span style={{color: '#bababa'}}><i className="fa fa-ban zr-padding-3" />未开</span>;
			case 'priority':
				return <zn.react.Select style={{ fontSize: 13, textAlign: 'center', textAlignLast: 'center', color: COLORS[value], borderColor: COLORS[value] }} onChange={(value)=>this.__onPriorityChange(value, data)} value={value} data={[{text:"非常紧急", value: 2}, {text:"紧急", value: 1}, {text:"正常", value: 0}]} />;
			case 'order_code':
				return <div><i data-tooltip="复制订单号" onClick={()=>zn.react.copyToClipboard(value)} className="fa fa-copy zr-padding-3" /><span data-tooltip={value}>{value}</span></div>;
			case 'consignee':
				var _info = data.consignee + '  ' + data.product_model + '  ' + data.consignee_telephone + '  ' + data.address;
				return <span><i data-tooltip="复制收货人信息" onClick={()=>zn.react.copyToClipboard(_info)} className="fa fa-copy zr-padding-3" />{value}</span>;
			case 'action':
				if(data.status==0){
					return <div style={{textAlign: 'center'}}>
						<span className="zr-tag" ><i className="fa fa-clock-o zr-padding-3" />等待流程审核</span>
						<span onClick={()=>this.__trashItem(data)} className="zr-tag danger" ><i className="fa fa-trash zr-padding-3" />作废订单</span>
					</div>;
				}
				switch (data.status) {
					case -1:
						return <div>
							{
								!!data.service_wf_instance_id ? <span className="zr-tag warning" onClick={()=>zn.react.session.relativeJump('/znpluginworkflow.wfinstance?instanceId=' + data.service_wf_instance_id)} ><i className="fa fa-clock-o zr-padding-3" />售后处理中, 点击查看详情...</span> : <span className="zr-tag" >售后处理中, 但未生成流程</span>
							}
							<span onClick={()=>this.__onCancleOrderService(data)} className="zr-tag danger"><i className="fa fa-remove zr-padding-3" />取消</span>
						</div>;
					case -2:
						if(data.service_wf_instance_id){
							return <span className="zr-tag ok" onClick={()=>zn.react.session.relativeJump('/znpluginworkflow.wfinstance?instanceId=' + data.service_wf_instance_id)} ><i className="fa fa-check zr-padding-3" />售后处理已完成, 点击查看详情...</span>;
						}else {
							return <span className="zr-tag" >售后处理结束, 未生成流程</span>;
						}
						break;
					default:
						return <span>
							<i className="zr-tag primary fa fa-angle-left" onClick={()=>this.__returnService(data)} >退换货售后</i>
							<i className="zr-tag primary fa fa-whatsapp" onClick={()=>this.__otherService(data)} >其他售后</i>
							<i className="zr-tag warning fa fa-exchange" onClick={()=>this.__backItem(data)} >退仓</i>
							<i className="zr-tag danger fa fa-trash" onClick={()=>this.__deleteItem(data)} >作废订单</i>
						</span>;
				}
			case 'count':
				if(data.status==0){
					return <span onClick={()=>this.__backItemWithoutStock(data)} className="zr-tag danger" ><i className="fa fa-edit zr-padding-3" />修改 {value}</span>;
				}else {
					return <a>{value}</a>
				}
			case 'express_code':
				return <span onClick={()=>this.__updateExpress(data)} className="zr-tag danger" ><i className="fa fa-edit zr-padding-3" />修改 {value}</span>;
			case 'express_state':
				if(!data.express_code){
					return <span className="zr-tag" >待上传单号</span>;
				}
				switch (value) {
					case -1:
						return <span className="zr-tag" onClick={()=>this.__refreshExpress(data)} ><i className="fa fa-refresh zr-padding-3" />暂无数据</span>;
					case 0:
						return <div>
							<span className="zr-tag" onClick={()=>this.__refreshExpress(data)} ><i className="fa fa-refresh zr-padding-3" />在途</span>
							<span className="zr-tag danger" onClick={()=>this.__showExpressDetail(data)} ><i className="fa fa-eye zr-padding-3" />查看详情</span>
						</div>;
					case 1:
						return <div>
							<span className="zr-tag" onClick={()=>this.__refreshExpress(data)} ><i className="fa fa-refresh zr-padding-3" />揽件</span>
							<span className="zr-tag danger" onClick={()=>this.__showExpressDetail(data)} ><i className="fa fa-eye zr-padding-3" />查看详情</span>
						</div>;
					case 2:
						return <div>
							<span className="zr-tag warning" onClick={()=>this.__refreshExpress(data)} ><i className="fa fa-refresh zr-padding-3" />疑难</span>
							<span className="zr-tag danger" onClick={()=>this.__showExpressDetail(data)} ><i className="fa fa-eye zr-padding-3" />查看详情</span>
						</div>;
					case 3:
						return <span className="zr-tag ok" onClick={()=>this.__showExpressDetail(data)} ><i className="fa fa-eye zr-padding-3" />签收</span>;
					case 4:
						return <div>
							<span className="zr-tag" onClick={()=>this.__refreshExpress(data)} ><i className="fa fa-refresh zr-padding-3" />退签</span>
							<span className="zr-tag danger" onClick={()=>this.__showExpressDetail(data)} ><i className="fa fa-eye zr-padding-3" />查看详情</span>
						</div>;
					case 5:
						return <div>
							<span className="zr-tag" onClick={()=>this.__refreshExpress(data)} ><i className="fa fa-refresh zr-padding-3" />派件</span>
							<span className="zr-tag danger" onClick={()=>this.__showExpressDetail(data)} ><i className="fa fa-eye zr-padding-3" />查看详情</span>
						</div>;
					case 6:
						return <div>
							<span className="zr-tag" onClick={()=>this.__refreshExpress(data)} ><i className="fa fa-refresh zr-padding-3" />退回</span>
							<span className="zr-tag danger" onClick={()=>this.__showExpressDetail(data)} ><i className="fa fa-eye zr-padding-3" />查看详情</span>
						</div>;
				}
			case 'remark':
				if(value != ""){
					return <span onClick={()=>this.__updateRemark(data)} className="zr-tag danger" ><i className="fa fa-edit zr-padding-3" /> {value}</span>;	
				}else{
					return <span onClick={()=>this.__updateRemark(data)} className="zr-tag" ><i className="fa fa-edit zr-padding-3" />添加备注 {value}</span>;
				}
		}

		return value;
	},
	__loadData: function (status, begin, end){
		this.state.status = status==null?this.state.status:status;
		this.state.begin = begin==null?this.state.begin:begin;
		this.state.end = end==null?this.state.end:end;
		if(!this.state.status){
			this.state.status = null;
		}
		this.state.data.extend({
			status: this.state.status,
			begin: this.state.begin,
			end: this.state.end
		}).refresh();
	},
	__search: function (){
		var _status = this.refs.status.getValue(),
			_begin = this.refs.begin_time.getValue(),
			_end = this.refs.end_time.getValue();
		this.__loadData(_status, _begin, _end);
	},
	render:function(){
		return (
			<div className="oa-admin-user-customer-order-details">
				<zn.react.Group title="过滤" className="page-title">
					<div className="_item">
						<span className="_key">订单状态：</span>
						<div className="_value" style={{display:'flex', alignItems: 'center'}}>
							<zn.react.Select value={0} ref="status" data={[{text:"正常", value: 1}, {text:"等待售后", value: -1}, {text:"售后结束", value: -2}]} />
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
							<zn.react.Button onClick={this.__search} text="查询" status="warning" icon="fa-search" style={{width: 80}} />
							<zn.react.Button onClick={this.__downloadAsExcel} text="导出为Excel" status="primary" icon="fa-download" style={{marginLeft: 10, width: 100}} />
							<zn.react.Button style={{marginLeft: 10, width: 120}} text={<zn.react.AjaxUploader
									action="/oa/sale/importExpressCode"
									onComplete={this.__onImportDataComplete}
									hiddens={{
										vars: {
											0: 'order_code',
											8: 'express_company',
											9: 'express_code',
											10: 'express_sum'
										}
									}} >
									导入快递Excel
								</zn.react.AjaxUploader>} icon='fa-upload' />
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
