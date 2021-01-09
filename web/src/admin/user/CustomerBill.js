var React = require('react');
module.exports = React.createClass({
	getInitialState: function () {
		return {
			state: -1,
			data: zn.store.post('/oa/bill/pagingBills', {
				where: { 
					customer_id: this.props.request.search.customerId
				}
			}),
			items: [
				{ title: '流程ID', name: 'instance_id', width: 120 },
				{ title: '金额(￥)', name: 'total_price', width: 100 },
				{ title: '操作类型', name: 'state', width: 100 },
				{ title: '充值/扣款时间', name: 'zn_create_time', width: 100, filter: { type: 'Input', opts: ['like'] }},
				{ title: '操作者', name: 'zn_create_user', width: 100 },
				{ title: '说明', name: 'zn_note', width: 100 }
			]
		}
	},
	__onTableColumnRender: function (rowIndex, columnIndex, data, item, value){
		if(item.name == 'instance_id'){
			if(value){
				return <a href={zn.react.session.relativeURL('/znpluginworkflow.wfinstance', { instanceId: value })}><i className="fa fa-eye" /> 查看流程 {value}</a>;
			}else {
				return <span style={{fontSize: 10}}>无相关流程</span>;
			}
		}
		if(item.name == 'total_price'){
			if(+value>0){
				return <span style={{color: 'green'}}>
				{'+' + value}
			</span>;
			}else {
				return <span style={{color: 'red'}}>
					{value}
				</span>;
			}
		}
		switch (item.name) {
			case 'state':
				switch (value) {
					case 0:
						return <span className="status" style={{backgroundColor: '#f0ad4e'}}>扣款</span>;
					case 1:
						return <span className="status" style={{backgroundColor: '#6def55'}}>充值</span>;
					case 2:
						return <span className="status" style={{backgroundColor: '#01a8ff'}}>退款</span>;
				}
				break;
		}
	},
	__onStateChange: function (data){
		this.setState({ state: data.value });
		this.state.data.extend({ 
			where: { 
				state: data.value,
				customer_id: this.props.request.search.customerId
			} 
		}).refresh();
	},
	__loadData: function (state, begin, end, where){
		var _data = {};
		this.state.state = state==undefined?this.state.state:state;
		this.state.begin = begin==undefined?this.state.begin:begin;
		this.state.end = end==undefined?this.state.end:end;
		this.state.where = where==undefined?this.state.where:where;

		_data.state = this.state.state;
		if(this.state.begin){
			_data.begin = this.state.begin;
		}
		if(this.state.end){
			_data.end = this.state.end;
		}
		if(this.state.where){
			_data.where = this.state.where;
		}
		this.state.data.extend(_data).refresh();
	},
	__search: function (where){
		var _state = this.refs.state.getValue(),
			_begin = this.refs.begin_time.getValue(),
			_end = this.refs.end_time.getValue();
		this.__loadData(_state, _begin, _end, where);
	},
	__cancel: function (){
		this.state.state = null;
		this.state.begin = null;
		this.state.end = null;
		this.refs.customer_id.setValue('');
		this.refs.status.setValue('');
		this.refs.begin_time.setValue('');
		this.refs.end_time.setValue('');
		this.state.where = {};
		this.__loadData();
	},
	__downloadAsExcel: function (){
		var _params = {
			customer_id: this.props.request.search.customerId
		};
		var _state = this.refs.state.getValue(),
			_begin = this.refs.begin_time.getValue(),
			_end = this.refs.end_time.getValue();
		
		if(_state != null){
			_params.state = _state;
		}
		if(_begin){
			_params.begin = _begin;
		}
		if(_end){
			_params.end = _end;
		}
		if(this.state.where){
			_params.where = this.state.where;
		}
		zn.react.downloadURL(zn.http.fixURL('/oa/bill/downloadCustomerBill?' + zn.querystring.stringify(_params)));
	},
	render:function(){
		return (
			<zn.react.Page title='对账单明细' className="zn-plugin-workflow-wf-my"
				toolbarItems={this.state.toolbarItems}
				onToolbarClick={this.__onToolbarClick} >
				<div style={{backgroundColor: '#FFF'}}>
					<zn.react.Group title="过滤" className="page-title">
						<div className="_item">
							<span className="_key">订单状态：</span>
							<div className="_value" style={{display:'flex', alignItems: 'center'}}>
								<zn.react.Select value={this.state.state} ref="state" data={[{text:"充值", value: 1}, {text:"扣款", value: 0}, {text:"退款", value: 2}]} />
							</div>
						</div>
						<div className="_item">
							<span className="_key">截止时间：</span>
							<div className="_value" style={{display:'flex', alignItems: 'center'}}>
								<zn.react.DateTime name="begin_time" ref="begin_time" />
								<span style={{margin: 5}}>--</span>
								<zn.react.DateTime name="end_time" ref="end_time" style={{margin: 5}} />
							</div>
						</div>
						<div className="_item" style={{marginTop: 10}}>
							<span className="_key"></span>
							<div className="_value" style={{display:'flex', alignItems: 'center'}}>
								<zn.react.Button onClick={()=>this.__search()} text="查询" status="warning" icon="fa-search" style={{width: 100}} />
								<zn.react.Button onClick={()=>this.__cancel()} text="取消过滤" status="danger" icon="fa-remove" style={{marginLeft: 10, width: 100}} />
								<zn.react.Button onClick={this.__downloadAsExcel} text="导出为Excel" status="primary" icon="fa-download" style={{marginLeft: 10, width: 150}} />
							</div>
						</div>
					</zn.react.Group>
				</div>
				<zn.react.PagerView
					view="Table"
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
