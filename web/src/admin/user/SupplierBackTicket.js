var React = require('react');

module.exports = React.createClass({
	getInitialState: function () {
		return {
			data: zn.store.post('/oa/supplier_service/pagingServiceBacks', {supplier_id: this.props.supplier}),
			items: [
				{ title: '操作', name: 'action', width: 140, textAlign: 'center' },
				{ title: '状态', name: 'status', width: 80 },
				{ title: '提交时间', name: 'zn_create_time', width: 140,  filter: { type: 'Input', opts: ['like'] } },
				{ title: '购买客户', name: 'customer_id', width: 200, convert: 'customer' },
				{ title: '商品名称', name: 'product_model', convert: 'product_title',  filter: { type: 'Input', opts: ['like'] } },
				{ title: '数量', name: 'count', width: 80 },
				{ title: '单价', name: 'price', width: 80 },
				{ title: '总额', name: 'amount', width: 100 },
				{ title: '姓名', name: 'name', width: 100 },
				{ title: '电话', name: 'phone', width: 100 },
				{ title: '地址', name: 'address', width: 100 }
			]
		}
	},
	__onTableColumnRender: function (rowIndex, columnIndex, data, item, value){
		switch (item.name) {
			case 'action':
				return <span>
					<i className="zr-tag warning fa fa-edit" onClick={()=>this.__backItem(data)} >销售详情</i>
					<i className="zr-tag warning fa fa-trash" onClick={()=>this.__deleteItem(data)} >售后详情</i>
				</span>;
			case 'status':
				switch (value) {
					case 0:
						return <span className="status" style={{backgroundColor: '#f0ad4e', color: '#FFF'}}>待结算</span>;
					case 1:
						return <span className="status" style={{backgroundColor: '#6def55', color: '#FFF'}}>已结算</span>;
					case -2:
						return <span className="status" style={{backgroundColor: '#dad8d8', color: '#FFF'}}>已取消</span>;
					case 2:
						return <span className="status" style={{backgroundColor: '#0d8c06', color: '#FFF'}}>已审核</span>;
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
	__downloadAsExcel: function (){
		var _params = {
			supplier_id: this.props.supplier
		};
		var _status = this.refs.status.getValue(),
			_begin = this.refs.begin_time.getValue(),
			_end = this.refs.end_time.getValue();
		if(_supplier_id){
			_params.status = _status;
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
			<div className="zn-plugin-workflow-wf-my oa-admin-user-customer-order-details">
				<zn.react.Group title="过滤" className="page-title">
					<div className="_item">
						<span className="_key">状态：</span>
						<div className="_value" style={{display:'flex', alignItems: 'center'}}>
							<zn.react.Select value={0} ref="status" data={[{ text: '待结算', value: 0 }, { text: '已结算', value: 1 }]} />
						</div>
					</div>
					<div className="_item">
						<span className="_key">截止时间：</span>
						<div className="_value" style={{display:'flex', alignItems: 'center'}}>
							<zn.react.Input ref="begin_time" attrs={{type:'date'}} />
							<span style={{margin: 5}}>--</span>
							<zn.react.Input ref="end_time" attrs={{type:'date'}}  style={{margin: 5}} />
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
