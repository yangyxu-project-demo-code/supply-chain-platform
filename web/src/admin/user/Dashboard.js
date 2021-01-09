require('./Dashboard.less');
var React = require('react');
module.exports = React.createClass({
	getInitialState: function () {
		return {
			applys: 0,
			dones: 0,
			todos: 0,
			caigous: 0,
			xiaoshous: 0,
			shouhous: 0,
			tiaobos: 0,
			warehouses: []
		}
	},
	componentDidMount: function (){
		this.__initData();
	},
	__initData: function (){
		zn.http.post('/oa/init/counts')
			.then(function (data){
				if(data.status==200){
					this.setState(data.result);
				}else {

				}
			}.bind(this), function (){

			});
	},
	render:function(){
		return (
			<zn.react.Page title='我的主页' className="oa-user-dashboard" >
				<div className="zr-dashboard">
					<div className="title">我的流程</div>
					<div className="row ">
						<div className="col-item number-item" onClick={()=>zn.react.session.relativeJump('/znpluginworkflow.wfmytodo')}>
							<div className="value">
								<div className="detail">
									<div className="count">{this.state.todos}</div>
									<div className="tip">我的待办</div>
								</div>
								<i className="fa fa-clock-o icon" />
							</div>
						</div>
						<div className="col-item number-item" onClick={()=>zn.react.session.relativeJump('/znpluginworkflow.wfmyapply')}>
							<div className="value">
								<div className="detail">
									<div className="count">{this.state.applys}</div>
									<div className="tip">我的申请</div>
								</div>
								<i className="fa fa-th-list icon" />
							</div>
						</div>
						<div className="col-item number-item" onClick={()=>zn.react.session.relativeJump('/znpluginworkflow.wfmydone')}>
							<div className="value">
								<div className="detail">
									<div className="count">{this.state.dones}</div>
									<div className="tip">经我处理</div>
								</div>
								<i className="fa fa-font-awesome icon" />
							</div>
						</div>
					</div>
					<div className="title">
						<span>我的工单</span>
					</div>
					<div className="row ">
						<div className="col-item number-item" onClick={()=>zn.react.session.relativeJump('/workorder.sale.ticket')}>
							<div className="value">
								<div className="detail">
									<div className="count">{this.state.xiaoshous}</div>
									<div className="tip">销售工单</div>
								</div>
								<i className="fa fa-user-secret icon" />
							</div>
							<div className="links" onClick={(event)=>event.stopPropagation()}>
								<span className="link" onClick={()=>zn.react.session.relativeJump('/workorder.sale.ticket.detail.search')}>发货订单</span>
							</div>
						</div>
						<div className="col-item number-item" onClick={()=>zn.react.session.relativeJump('/workorder.in.ticket')}>
							<div className="value">
								<div className="detail">
									<div className="count">{this.state.caigous}</div>
									<div className="tip">采购工单</div>
								</div>
								<i className="fa fa-sign-in icon" />
							</div>
							<div className="links" onClick={(event)=>event.stopPropagation()}>
								<span className="link" onClick={()=>zn.react.session.relativeJump('/workorder.in.ticket.detail.search')}>采购订单</span>
							</div>
						</div>
						<div className="col-item number-item" onClick={()=>zn.react.session.relativeJump('/workorder.allocate.ticket')}>
							<div className="value">
								<div className="detail">
									<div className="count">{this.state.tiaobos}</div>
									<div className="tip">调拨工单</div>
								</div>
								<i className="fa fa-exchange icon" />
							</div>
						</div>
						<div className="col-item number-item" onClick={()=>zn.react.session.relativeJump('/workorder.sale.service.ticket')}>
							<div className="value">
								<div className="detail">
									<div className="count">{this.state.shouhous}</div>
									<div className="tip">售后工单</div>
								</div>
								<i className="fa fa-tty icon" />
							</div>
							<div className="links" onClick={(event)=>event.stopPropagation()}>
								<span className="link" onClick={()=>zn.react.session.relativeJump('/workorder.sale.service.ticket.detail.list')}>退换货单据</span>
							</div>
						</div>
					</div>
					<div className="title">
						<span>仓库库存</span>
					</div>
					<div className="row ">
						{
							this.state.warehouses.map(function (item){
								return <div className="col-item number-item" onClick={()=>zn.react.session.relativeJump('/znpluginstock.ProductStock?warehouse=' + item.warehouse_id)}>
									<div className="value">
										<div className="detail">
											<div className="count">{item.count}<span className="unit">件</span></div>
											<div className="tip">{item.warehouse_id_convert}</div>
										</div>
										<i className="fa fa-institution icon" />
									</div>
								</div>;
							})
						}
					</div>
					{
						/*
						<div className="title">
							<span>我的库存</span>
							<zn.react.Search placeholder="输入商品型号查询库存" />
						</div>
						<div className="item ">

						</div>
						*/
					}
				</div>
			</zn.react.Page>
		);
	}
});
