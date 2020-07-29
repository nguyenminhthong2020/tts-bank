const express = require("express");
const moment = require("moment");
// const axios = require("axios");
// const md5 = require("md5");
// const NodeRSA = require("node-rsa");
const User = require("../models/user.model");
const Account = require("../models/account.model");
// const ListDebt = require('../models/listDebt.model');
// const Otp = require("../models/otp.model");
const Transaction = require('../models/TransactionHistory.model');
const TransactionDebt = require("../models/transactionDebtHistory.model");
// var nodemailer = require("nodemailer");
// const config = require("../config/default.json");
// const process1 = require("../config/process.config");

const router = express.Router();

/* Phân hệ Customer */
//Xem lịch sử Giao dịch nhận tiền
router.get('/receive', async function(req, res){
    const { user_id } = req.tokenPayload;
    
    try{
        const _account = await Account.findOne({user_id: user_id});
        const list = await Transaction.find({receiver_account_number: _account.account_number})
                                      .sort({transaction_id: -1});

        return res.status(200).send(list);
    }catch(err){
        return res.status(500).send(err.message);
    }
});

//Xem lịch sử Giao dịch chuyển khoản
router.get('/send', async function(req, res){
    const { user_id } = req.tokenPayload;
    
    try{
        const _account = await Account.findOne({user_id: user_id});
        const list = await Transaction.find({sender_account_number: _account.account_number})
                                      .sort({transaction_id: -1});
                                      
        return res.status(200).send(list);
    }catch(err){
        return res.status(500).send(err.message);
    }
});

//Xem lịch sử Giao dịch thanh toán nhắc nợ
router.get('/debt', async function(req, res){
    const { user_id } = req.tokenPayload;
    const checkUser = await User.findOne({ user_id: user_id });
    // if (checkUser.role == 0) {
    //     return res.status(400).send({message:"Bạn không đủ thẩm quyền."});
    // }

    try{
        const _account = await Account.findOne({user_id: user_id});
        const list = await TransactionDebt.find({debtor_account_number: _account.account_number})
                                       .sort({transaction_debt_id: -1});

        return res.status(200).send(list);
    }catch(err){
        return res.status(500).send(err.message);
    }
   
});


/* Phân hệ Employee */
//Xem lịch sử Giao dịch nhận tiền
// body gửi lên có account_number (của khách)
router.post('/employee/receive', async function(req, res){
    const { user_id } = req.tokenPayload;
    const checkUser = await User.findOne({ user_id: user_id });
    if (checkUser.role == 0) {
        return res.status(400).send({message:"Bạn không đủ thẩm quyền."});
    }
    
    try{
        //const _account = await Account.findOne({account_number: req.body.account_number});
        const list = await Transaction.find({receiver_account_number: req.body.account_number})
                                      .sort({transaction_id: -1});

        return res.status(200).send(list);
    }catch(err){
        return res.status(500).send(err.message);
    }
});

//Xem lịch sử Giao dịch chuyển khoản
// body gửi lên có account_number (của khách)
router.post('/employee/send', async function(req, res){
    const { user_id } = req.tokenPayload;
    const checkUser = await User.findOne({ user_id: user_id });
    if (checkUser.role == 0) {
        return res.status(400).send({message:"Bạn không đủ thẩm quyền."});
    }
    
    try{
        //const _account = await Account.findOne({user_id: user_id});
        const list = await Transaction.find({sender_account_number: req.body.account_number})
                                      .sort({transaction_id: -1});
                                      
        return res.status(200).send(list);
    }catch(err){
        return res.status(500).send(err.message);
    }
});

//Xem lịch sử Giao dịch thanh toán nhắc nợ
// body gửi lên có account_number (của khách)
router.post('/employee/debt', async function(req, res){
    const { user_id } = req.tokenPayload;
    const checkUser = await User.findOne({ user_id: user_id });
    if (checkUser.role == 0) {
        return res.status(400).send({message:"Bạn không đủ thẩm quyền."});
    }
    
    try{
        //const _account = await Account.findOne({user_id: user_id});
        const list = await TransactionDebt.find({debtor_account_number: req.body.account_number})
                                       .sort({transaction_debt_id: -1});

        return res.status(200).send(list);
    }catch(err){
        return res.status(500).send(err.message);
    }
   
});

/* Phân hệ Admin */
// body gửi lên có start, end, bank_code
router.post('/admin', async function(req, res){
    const { user_id } = req.tokenPayload;
    const checkUser = await User.findOne({ user_id: user_id });
    if (checkUser.role < 2) {
      return res.status(400).send({message:"Bạn không đủ thẩm quyền."});
    }
    
    if(req.body.bank_code === "All")
    {
        const startDate = req.body.start;
        const endDate = req.body.end;

        try{
            
            let allTran = await Transaction.find({
                $where: function() {
                    return ((this.sender_bank_code != this.receive_bank_code) && (moment(this.created_at) >= startDate) && (moment(this.created_at) <= endDate))
                 }
            });
            
            if (allTran) {
                return res.status(200).send({
                    status: "OK",
                    data: allTran,
                })
            }else{
                return res.status(400).json({
                    message: "Không thể truy vấn"
                })
            }
        
            
            // const allTranSend = await Transaction.find(
            // {
            //     $and: [
            //         {
            //             $or:[
            //                 {sender_bank_code: "GO", receive_bank_code: "25Bank"}
            //                 ,{sender_bank_code: "25Bank", receive_bank_code: "GO"}
            //                 ,{sender_bank_code: "GO", receive_bank_code: "20PGP"}
            //                 ,{sender_bank_code: "20PGP", receive_bank_code: "GO"}
            //             ]
            //         },
            //         {
            //             $and:[{}, {}]
            //         }
            //     ]
            // });

        }catch(err){
            return res.status(500).send(err.message);
        }

    }else{
        
        const startDate = req.body.start;
        const endDate = req.body.end;
        const _bank_code = req.body.bank_code;

        try{
            
            let allTran = await Transaction.find({
                $where: function() {
                    return (((this.sender_bank_code == _bank_code) || (this.sender_bank_code == _bank_code)) && (moment(this.created_at) >= startDate) && (moment(this.created_at) <= endDate))
                 }
            });
            
            if (allTran) {
                return res.status(200).send({
                    status: "OK",
                    data: allTran,
                })
            }else{
                return res.status(400).json({
                    message: "Không thể truy vấn"
                })
            }

        }catch(err){
            return res.status(500).send(err.message);
        }
    }


});
router.post('/admin2', async function(req, res){
    const { user_id } = req.tokenPayload;
    const checkUser = await User.findOne({ user_id: user_id });
    if (checkUser.role < 2) {
      return res.status(400).send({message:"Bạn không đủ thẩm quyền."});
    }
    
    if(req.body.bank_code === "All")
    {
        const startDate = req.body.start;
        const endDate = req.body.end;
        
        // var data = [];
        // Transaction.find({
        // }).exec(function (err, trans) {
        //     if (err) {
        //         return res.status(500).json({
        //                         message: "Không thể truy vấn"
        //                     });

        //     } else {
        //         for(let i = 0; i < trans.length; i++)
        //         if((trans[i].sender_bank_code != trans[i].receive_bank_code) && (moment(trans[i].created_at) >= startDate) && (moment(trans[i].created_at) <= endDate))
        //         {
        //                data.push(trans[i]);
        //         };
                 
        //     }

        try{
            
            let allTran = await Transaction.find({
            });
            
            if (allTran) {
                const allTranResult = allTran.filter(x => ((x.sender_bank_code != x.receive_bank_code) && (moment(x.created_at) >= startDate) && (moment(x.created_at) <= endDate)));
                console.log("\n");
                console.log(allTranResult);
                console.log("\n");
                let money = 0;

                for (let i = 0; i < allTranResult.length; i++)
                {
                    money += allTranResult[i].money;
                }

                return res.status(200).send({
                    status: "OK",
                    money : money,
                    data: allTranResult
                })
            }else{
                return res.status(400).json({
                    message: "Không thể truy vấn"
                })
            }

        }catch(err){
            return res.status(500).send(err.message);
        }

    

    }else{
        
        const startDate = req.body.start;
        const endDate = req.body.end;
        const _bank_code = req.body.bank_code;

        try{
            
            let allTran1 = await Transaction.find({
            });
            
            if (allTran1) {
                const allTranResult1 = allTran1.filter(x => (((x.sender_bank_code == _bank_code) || (x.sender_bank_code == _bank_code)) && (moment(x.created_at) >= startDate) && (moment(x.created_at) <= endDate)));
                
                let money1 = 0;

                for (let i = 0; i < allTranResult1.length; i++)
                {
                    money1 += allTranResult1[i].money;
                }

                return res.status(200).send({
                    money: money1,
                    status: "OK",
                    data: allTranResult1
                })
            }else{
                return res.status(400).json({
                    message: "Không thể truy vấn"
                })
            }

        }catch(err){
            return res.status(500).send(err.message);
        }
    }


});

module.exports = router;