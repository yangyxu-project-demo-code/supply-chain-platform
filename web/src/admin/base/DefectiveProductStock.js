var React = require('react');
var ProductStockLog = zn.plugin.stock.ProductStockLog;

module.exports = React.createClass({
	getInitialState: function () {
		return {
			data: zn.store.post('/zn.plugin.stock/stock/getWarehouseStock', {
				warehouseId: this.props.warehouseId,
				typeId: this.props.productType,
				join: 'right'
			}),
			items: [
				//{ title: '序列号', name: 'serial_number', width: 130, filter: { type: 'Input', opts: ['like'] } },
				{ title: '商品名称', name: 'zn_title', width: 160, filter: { type: 'Input', opts: ['like'] } },
				{ title: '型号', name: 'model', width: 160, filter: { type: 'Input', opts: ['like'] }},
				{ title: '所在仓库', name: 'warehouse_id_convert', width: 160 },
				{ title: '当前库存量', name: 'count', width: 160 },
				{ title: '规格', name: 'specification', width: 50 },
				{ title: '单位', name: 'unit', width: 50 },
				{ title: '净重(Kg)', name: 'net_weight', width: 100 },
				{ title: '毛重(Kg)', name: 'gross_weight', width: 100 },
				{ title: '包装尺寸(mm)', name: 'package_size', width: 100 },
				{ title: '容积(L)', name: 'volume', width: 100 },
				{ title: '单价(￥)', name: 'price', width: 100 },
				{ title: '最低价(￥)', name: 'min_price', width: 100 },
				{ title: '平均价(￥)', name: 'average_price', width: 100 },
				{ title: '最高价(￥)', name: 'max_price', width: 100 },
				{ title: '采购价(￥)', name: 'purchase_price', width: 100 },
				{ title: '销售价(￥)', name: 'sale_price', width: 100 },
				{ title: '物流单价(￥)', name: 'express_price', width: 100 },
				{ title: '说明', name: 'zn_note' }
			]
		}
	},
	componentWillReceiveProps: function (nextProps){
		if(nextProps.productType!=this.props.productType || nextProps.where != this.props.where){
			this.state.data.extend({
				warehouseId: nextProps.warehouseId,
				typeId: nextProps.productType,
				where: nextProps.where
			}).refresh();
		}
	},
	__onStockClick: function (data){
		zn.react.session.relativeJump('/znpluginstock.ProductStockLog', {
			warehouse: data.warehouse_id,
			product_model: data.model
		});
	},
	__onBackToWarehouse: function (data, event){
		event.stopPropagation();
		zn.dialog({
			title: '调拨回仓',
			content: <zn.react.Form
				action='/oa/stock/allocateSingleProductStock'
				exts={{ product_model: data.model, out_warehouse: 8 }}
				onSubmitSuccess={()=>{
					zn.notification.success('调拨成功');
					this.state.data.refresh();
				}}
				onSubmitBefore={(value)=>{
					if(value.count>data.count){
						return zn.notification.warning('调拨数量不能超过' + data.count + "个"), false;
					}
				}}
				items={[
					{ title: '入库仓', required: true, name: 'in_warehouse', type: 'Select', data: zn.store.post("/zn.plugin.admin/model/select", {"model": "zn_plugin_stock_warehouse", "fields": "id as value, zn_title as text", "where": { "&8<>": "id", "warehouse_type": "self" } }) },
					{ title: '调拨数量', required: true, name: 'count', type: 'Input', attrs: { min: 0, type: 'number', max: data.count } }
				]} />
		});
	},
	__onTableColumnRender: function (rowIndex, columnIndex, data, item, value){
		if(item.name == 'serial_number' || item.name == 'model'){
			return <span><i data-tooltip="复制序列号" onClick={()=>zn.react.copyToClipboard(value)} className="fa fa-clipboard" /> {value}</span>
		}
		if(item.name=='count'){
			return <div>
				{
					!!data.warehouse_id?<a onClick={()=>this.__onStockClick(data)} href="javascript:void(0);"  style={{fontWeight: 500}}>
						{
							value>0?<span data-tooltip="查看详情" style={{color: 'green'}}>{value}<i onClick={(event)=>this.__onBackToWarehouse(data, event)} className="zr-tag danger fa fa-exchange">调拨回仓</i></span>:<span data-tooltip="点击查看详情" style={{color: '#F44336'}}>{value}</span>
						}
					</a>:<span style={{color: '#a0a0a0', fontWeight: 500}}>暂无库存</span>}
			</div>;
		}
		/*
		if(item.name=='warehouse_id_convert'){
			return <a href={zn.react.session.relativeURL('/znpluginstock.ProductStock', { warehouse:data.warehouse_id })} data-tooltip={"查看" + value + "库存详情"} style={{color: 'green'}}>{value}</a>;
		}*/
		if(item.title && item.title.indexOf('￥') != -1){
			value = (value).toFixed(2) + '￥';
		}
		return value;
	},
	render:function(){
		return (
			<zn.react.PagerView
				{...this.props}
				view="Table"
				enableFilter={true}
				showHeader={true}
				columnRender={this.__onTableColumnRender}
				data={this.state.data}
				dataFixed={true}
				items={this.state.items}/>
		);
	}
});
