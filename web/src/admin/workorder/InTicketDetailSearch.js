var React = require('react');


module.exports = React.createClass({
	getInitialState: function () {
		return {
			data: zn.store.post('/oa/in/getSupplierProductList'),
			items: [
				{ title: '操作', name: 'action', width: 140, textAlign: 'center' },
				{ title: '提交时间', name: 'zn_create_time', width: 140,  filter: { type: 'Input', opts: ['like'] } },
				{ title: '供应商', name: 'supplier_id', width: 200, convert: 'supplier' },
				{ title: '商品名称', name: 'product_model', width: 180, convert: 'product_title',  filter: { type: 'Input', opts: ['like'] } },
				{ title: '商品型号', name: 'product_model', width: 120, filter: { type: 'Input', opts: ['like'] } },
				{ title: '数量', name: 'count', width: 80 },
				{ title: '单价', name: 'price', width: 80 },
				{ title: '总额', name: 'amount', width: 100 },
				{ title: '物流金额', name: 'express_sum', width: 100 },
				{ title: '姓名', name: 'name', width: 100, filter: { type: 'Input', opts: ['like'] } },
				{ title: '电话', name: 'phone', width: 100, filter: { type: 'Input', opts: ['like'] } },
				{ title: '地址', name: 'address', width: 100 }
			]
		}
	},
	__deleteItem: function (data) {
		var _self = this;
		zn.confirm('作废订单, 该商品库存将回到出库仓,确定作废吗？','提示', function (){
			zn.http.post('/oa/in/updateItemCount', {
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
				title: '修改数量',
				content: <div>
					<div className="zn-note" style={{margin: 6}}>注：发起修改订单数量和对应出库仓库存将同时发生变化。</div>
					<zn.react.Form
						action='/oa/in/updateItemCount'
						exts={{ item_id: data.id }}
						onSubmitBefore={(value)=>{
							if(value.count>data.count){
								return zn.notification.error('数量不能超过' + data.count + '个'), false;
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
			zn.http.post('/oa/in/updateItemCountWithoutStock', {
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
						action='/oa/in/updateItemCountWithoutStock'
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
	__onTableColumnRender: function (rowIndex, columnIndex, data, item, value){
		if(typeof value=='number' && !isNaN(value)){
			return (value||0).toFixed(2);
		}
		switch (item.name) {
			case 'action':
				return <span>
					<i className="zr-tag warning fa fa-edit" onClick={()=>this.__backItem(data)} >退回数量</i>
					<i className="zr-tag danger fa fa-trash" onClick={()=>this.__deleteItem(data)} >作废订单</i>
				</span>;
		}

		return <span data-tooltip={value}>{value}</span>;
	},
	__loadData: function (supplier_id, begin, end){
		this.state.supplier_id = supplier_id==null?this.state.supplier_id:supplier_id;
		this.state.begin = begin==null?this.state.begin:begin;
		this.state.end = end==null?this.state.end:end;
		var _data = {};
		if(this.state.begin){
			_data.begin = this.state.begin;
		}
		if(this.state.end){
			_data.end = this.state.end;
		}
		if(this.state.supplier_id){
			_data.supplier_id = this.state.supplier_id;
		}
		this.state.data.extend(_data).refresh();
	},
	__search: function (){
		var _supplier_id = this.refs.supplier_id.getValue(),
			_begin = this.refs.begin_time.getValue(),
			_end = this.refs.end_time.getValue();
		this.__loadData(_supplier_id, _begin, _end);
	},
	__cancel: function (){
		this.state.supplier_id = null;
		this.state.begin = null;
		this.state.end = null;
		this.refs.supplier_id.setValue('');
		this.refs.begin_time.setValue('');
		this.refs.end_time.setValue('');
		this.__loadData();
	},
	__downloadAsExcel: function (){
		var _params = {};
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
		zn.react.downloadURL(zn.http.fixURL('/oa/in/downloadSupplierProductList?' + zn.querystring.stringify(_params)));
	},
	render:function(){
		return (
			<zn.react.Page title='采购商品查询' className="oa-admin-user-customer-order-details">
				<zn.react.Group title="过滤" className="page-title">
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
					<div className="_item" style={{marginTop: 10}}>
						<span className="_key"></span>
						<div className="_value" style={{display:'flex', alignItems: 'center'}}>
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
