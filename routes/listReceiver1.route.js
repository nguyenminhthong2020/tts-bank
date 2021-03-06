const express = require("express");
const moment = require("moment");
const md5 = require('md5');
// const crypto = require('crypto');
// const openpgp = require('openpgp');
const sha256 = require('sha256');
const axios = require('axios');
const NodeRSA = require('node-rsa');
const User = require("../models/user.model");
const Account = require("../models/account.model");
const ListReceiver = require("../models/listReceiver.model");

const router = express.Router();


// Route đi tìm tài khoản từ đối tác 25Bank (qua API của 25Bank)
// body gửi lên có receiver_account_number
router.post('/partner/find', async function(req, res){
     // Đi tìm người nhận có receiver_account_number từ đối tác 25Bank
     const str1 = `-----BEGIN PUBLIC KEY-----
     MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlgYOdnw1EBNhzIiKP3Ep
     ieY2sOhHhUYAdTKn7/kXX0DXdEdWU4Jnkkv6F8dtLhkGn6wL/tMsPuuLlms3ntoO
     OfPyq3YCD6gpnVb2ns7058dI83AQMPEq8KLlf2JHbxOHIgdnhi8HF/q9D48eJR3m
     V1BEOHzNpjN/URZ/1cF7x/FEAls5esotYle3NDeP31qIxGT/QSbEknBFwrDY73yj
     BqRp/2nJ1ns6Nz2YFxlT/W8PLaq9g5rOh3HGg7bO8IuK8RubQqnSSEFOVShvNzmb
     Q9G9IqqMyggY21r0Ft3e6WyntluVxIzVd8KkY9Gni/vWYC3MXTiGDLG0ABYnT44s
     HwIDAQAB
     -----END PUBLIC KEY-----`;
     const key = new NodeRSA(str1);
     
     let _DestinationAccountNumber = parseInt(req.body.receiver_account_number);

     const t = moment().valueOf();
     const text = {"BankName":"GO","DestinationAccountNumber":_DestinationAccountNumber,"iat":t};

     const encrypted = key.encrypt(text, 'base64');

     const str2 = `-----BEGIN RSA PRIVATE KEY-----
     MIICXAIBAAKBgQC9qm1koCe/O52tzs7/NfYLsScw/YuU254M9SYxu7mR5zBxNsxj
     YoGBpGtNQdn3qBaPyiBiczLPOYU8BS2R10FDzZp2KRXOzY7vuhKZXl4WBcc94LOO
     yN+nYevI03JBjHOPV0qlSIsS2nDbhfmT58/bF8920IYJI5/Vxi6+KXAsGwIDAQAB
     AoGAZFd16HaSkKmJkhqHiJ2TvjvK8DAzWF2YEGLiAg2+72HQTxUerLXArkW+PvFH
     z64twYS9/VfU2a0kv8w9f5rR+5PlcuqNYCPzn/JUUAQrMvcFVrYaXtv8FfLWpyFe
     Tncgopv5WyTy7isMyomFkBg7TMHjdyhw84h9IkSMCc3TbQECQQDhJ76/NYhJT7GJ
     n6nDGh+ZpevHoAkQsBoTpqulvjnFGmovz/mhBHNxZtfoDEWd18clNKBWtuYDiNEg
     w1qDqw4ZAkEA16YOIAoEO5DYjHH5OyNsL/ATKlDqj3ddO4LxhvlCVXjaC4LE8qyj
     rZhTjFLzGr+wvAZGQyuqyyU7r1r7Bk6qUwJBAIqXAF6KAP2/RDTGRqSFK/ZTnzId
     W/cdrq9x5C39TWn5vGr5xVpLdxPSjguTojZqX3aTUi6OHj8GtFNKbCin3eECQDma
     b7d7NXo7zLxnTW3QnnuHo3bwOlesSMk2xxGIz4FJUOU2Pymbl/Us9VRMbAe/IJR5
     EJesuGifP3wtz1P1+2UCQCca7q32yp272Hl3FoZ/SYyYGVu97FAeSbwhrnPPJG87
     70X2jyKNMEZYbjIsrulyv57DOS0lt8qLqdy62FtaMuE=
     -----END RSA PRIVATE KEY-----`;

     const new_key = new NodeRSA(str2);
     const signature = new_key.sign(text, 'base64');

   //   console.log(encrypted);
   //   console.log("\n"+signature);
   let reqBody = {
      'Encrypted': encrypted,
      'Signed': signature,
    }

   axios({
      method: 'get',
      url: 'https://bank25.herokuapp.com/api/partner/account-bank/destination-account',
      data: reqBody
    }).then(async function (response) {
        //const str2 = JSON.stringify(response.data);
        const strTest = response.data.TenKhachHang + "";
        if(strTest == "undefined"){
         return res.status(400).send({ status: "NO_ACCOUNT", message: "Không tìm thấy người dùng." });
        }else{
         return res.status(200).send({ status: "OK", fullname:  response.data.TenKhachHang});
        }
        //return Response.Ok(res, {'bankName': response.data.TenKhachHang});
      })
      .catch(function (err) {
         return res.status(500).send({ status: "ERROR", message: err.response.data});
        //console.log(err)
        //return console.log("\n"+JSON.stringify(err.response.data));
        //return Response.SendMessaageRes(res.status(err.response.status), JSON.stringify(err.response.data))
      })
})


// Route đi tìm tài khoản từ đối tác partner34 (qua API của partner34)
// partner34 là nhóm PGP
// body gửi lên có receiver_account_number
router.post('/partner/find-pgp', async function(req, res){
  const ts = moment().valueOf();
  const key = 'Infymt';
  const sig = sha256(ts+key);
  
  axios.defaults.headers = {
      'x-time': ts,
      'x-signature': sig,
      'x-partner-code': "GO"
    };
  
  axios({
      method: 'get',
      url: `https://banking34.herokuapp.com/api/user/${req.body.receiver_account_number}`
    }).then(async function (response) {
        //const str2 = JSON.stringify(response.data);
        const strTest = response.data.fullname + "";
        if(strTest == "undefined"){
         return res.status(400).send({ status: "NO_ACCOUNT", message: "Không tìm thấy người dùng." });
        }else{
         return res.status(200).send({ status: "OK", fullname:  response.data.fullname});
        }
      })
      .catch(function (err) {
         console.log(err.response.data);
        //return console.log("\n"+JSON.stringify(err.response.data));
        //return Response.SendMessaageRes(res.status(err.response.status), JSON.stringify(err.response.data))
      })
    
})

// Body gửi lên gồm có receiver_account_number, bank_code và remind_name (remind_name có thể rỗng)
// và type (type là String, type = 1 => req.body.remind_name == "", type = 2 : có tên gợi nhớ)
router.post("/", async function (req, res) {
  const { user_id } = req.tokenPayload;

  if (req.body.bank_code == "GO") {      // người nhận trong nội bộ
    try {
      const _account = await Account.findOne({
        account_number: req.body.receiver_account_number,
      });
      if (_account) {
        if (req.body.type == "1") {
          const _user = await User.findOne({ user_id: _account.user_id });
          const newReceiver = {
            user_id: user_id,
            receiver_account_number: req.body.receiver_account_number,
            remind_name: _user.fullname,
            bank_code: req.body.bank_code,
          };

          let newList = ListReceiver(newReceiver);
          const ret = await newList.save();

          return res.status(201).send({ message: "thêm thành công" });
        } else {
          const newReceiver1 = {
            user_id: user_id,
            receiver_account_number: req.body.receiver_account_number,
            remind_name: req.body.remind_name,
            bank_code: req.body.bank_code,
          };

          let newList1 = ListReceiver(newReceiver1);
          const ret1 = await newList1.save();

          return res.status(201).send({ message: "thêm thành công" });
        }
      } else {
        req
          .status(500)
          .send({
            status: "NO_ACCOUNT",
            message: "Không tồn tại account để thêm vào list",
          });
      }
    } catch (err) {
      return res.status(500).send(err.message);
    }
  }else if(req.body.bank_code == "25Bank"){

            // Đi tìm người nhận có receiver_account_number từ đối tác 25Bank
      const str1 = `-----BEGIN PUBLIC KEY-----
      MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlgYOdnw1EBNhzIiKP3Ep
      ieY2sOhHhUYAdTKn7/kXX0DXdEdWU4Jnkkv6F8dtLhkGn6wL/tMsPuuLlms3ntoO
      OfPyq3YCD6gpnVb2ns7058dI83AQMPEq8KLlf2JHbxOHIgdnhi8HF/q9D48eJR3m
      V1BEOHzNpjN/URZ/1cF7x/FEAls5esotYle3NDeP31qIxGT/QSbEknBFwrDY73yj
      BqRp/2nJ1ns6Nz2YFxlT/W8PLaq9g5rOh3HGg7bO8IuK8RubQqnSSEFOVShvNzmb
      Q9G9IqqMyggY21r0Ft3e6WyntluVxIzVd8KkY9Gni/vWYC3MXTiGDLG0ABYnT44s
      HwIDAQAB
      -----END PUBLIC KEY-----`;
      const key = new NodeRSA(str1);
      
      let _DestinationAccountNumber = parseInt(req.body.receiver_account_number);

      const t = moment().valueOf();
      const text = {"BankName":"GO","DestinationAccountNumber":_DestinationAccountNumber,"iat":t};

      const encrypted = key.encrypt(text, 'base64');

      const str2 = `-----BEGIN RSA PRIVATE KEY-----
      MIICXAIBAAKBgQC9qm1koCe/O52tzs7/NfYLsScw/YuU254M9SYxu7mR5zBxNsxj
      YoGBpGtNQdn3qBaPyiBiczLPOYU8BS2R10FDzZp2KRXOzY7vuhKZXl4WBcc94LOO
      yN+nYevI03JBjHOPV0qlSIsS2nDbhfmT58/bF8920IYJI5/Vxi6+KXAsGwIDAQAB
      AoGAZFd16HaSkKmJkhqHiJ2TvjvK8DAzWF2YEGLiAg2+72HQTxUerLXArkW+PvFH
      z64twYS9/VfU2a0kv8w9f5rR+5PlcuqNYCPzn/JUUAQrMvcFVrYaXtv8FfLWpyFe
      Tncgopv5WyTy7isMyomFkBg7TMHjdyhw84h9IkSMCc3TbQECQQDhJ76/NYhJT7GJ
      n6nDGh+ZpevHoAkQsBoTpqulvjnFGmovz/mhBHNxZtfoDEWd18clNKBWtuYDiNEg
      w1qDqw4ZAkEA16YOIAoEO5DYjHH5OyNsL/ATKlDqj3ddO4LxhvlCVXjaC4LE8qyj
      rZhTjFLzGr+wvAZGQyuqyyU7r1r7Bk6qUwJBAIqXAF6KAP2/RDTGRqSFK/ZTnzId
      W/cdrq9x5C39TWn5vGr5xVpLdxPSjguTojZqX3aTUi6OHj8GtFNKbCin3eECQDma
      b7d7NXo7zLxnTW3QnnuHo3bwOlesSMk2xxGIz4FJUOU2Pymbl/Us9VRMbAe/IJR5
      EJesuGifP3wtz1P1+2UCQCca7q32yp272Hl3FoZ/SYyYGVu97FAeSbwhrnPPJG87
      70X2jyKNMEZYbjIsrulyv57DOS0lt8qLqdy62FtaMuE=
      -----END RSA PRIVATE KEY-----`;

      const new_key = new NodeRSA(str2);
      const signature = new_key.sign(text, 'base64');

      //   console.log(encrypted);
      //   console.log("\n"+signature);
      let reqBody = {
         'Encrypted': encrypted,
         'Signed': signature,
      }

      axios({
         method: 'get',
         url: 'https://bank25.herokuapp.com/api/partner/account-bank/destination-account',
         data: reqBody
      }).then(async function (response) {
        //  const str2 = JSON.stringify(response.data);
        //  console.log(str2);
        const strTest = response.data.TenKhachHang + "";

         if(strTest == "undefined"){
            return res.status(400).send({ status: "NO_ACCOUNT", message: "Không tìm thấy người dùng." });
         }else{
            //return res.status(200).send({ status: "OK", fullname:  response.data.TenKhachHang});

         //return Response.Ok(res, {'bankName': response.data.TenKhachHang});

            if (req.body.type == "1"){
              const newReceiver4 = {
                user_id: user_id,
                receiver_account_number: req.body.receiver_account_number,
                remind_name: response.data.TenKhachHang,
                bank_code: req.body.bank_code,
              };
    
              let newList4 = ListReceiver(newReceiver4);
              const ret4 = await newList4.save();
    
              return res.status(201).send({ message: "thêm thành công" });
            }else {
              const newReceiver5 = {
                user_id: user_id,
                receiver_account_number: req.body.receiver_account_number,
                remind_name: req.body.remind_name,
                bank_code: req.body.bank_code,
              };
    
              let newList5 = ListReceiver(newReceiver5);
              const ret5 = await newList5.save();
    
              return res.status(201).send({ message: "thêm thành công" });
            }
          }
         })
         .catch(function (err) {
            return res.status(500).send({ status: "ERROR", message: err.response.data});

         //console.log(err)
         //return console.log("\n"+JSON.stringify(err.response.data));
         //return Response.SendMessaageRes(res.status(err.response.status), JSON.stringify(err.response.data))
         })

      

  }else{
       
       // Đi tìm người nhận có receiver_account_number từ đối tác partner34
       const ts = moment().valueOf();
      const key = 'Infymt';
      const sig = sha256(ts+key);
      
      axios.defaults.headers = {
          'x-time': ts,
          'x-signature': sig,
          'x-partner-code': "GO"
        };


      axios({
        method: 'get',
        url: `https://banking34.herokuapp.com/api/user/${req.body.receiver_account_number}`
      }).then(async function (response) {
        //  const str2 = JSON.stringify(response.data);
        //  console.log(str2);
        const strTest = response.data.fullname + "";

         if(strTest == "undefined"){
            return res.status(400).send({ status: "NO_ACCOUNT", message: "Không tìm thấy người dùng." });
         }else{
            //return res.status(200).send({ status: "OK", fullname:  response.data.TenKhachHang});

         //return Response.Ok(res, {'bankName': response.data.TenKhachHang});

            if (req.body.type == "1"){
              const newReceiver4x = {
                user_id: user_id,
                receiver_account_number: req.body.receiver_account_number,
                remind_name: response.data.fullname,
                bank_code: req.body.bank_code,
              };
    
              let newList4x = ListReceiver(newReceiver4x);
              const ret4x = await newList4x.save();
    
              return res.status(201).send({ message: "thêm thành công" });
            }else {
              const newReceiver5x = {
                user_id: user_id,
                receiver_account_number: req.body.receiver_account_number,
                remind_name: req.body.remind_name,
                bank_code: req.body.bank_code,
              };
    
              let newList5x = ListReceiver(newReceiver5x);
              const ret5 = await newList5x.save();
    
              return res.status(201).send({ message: "thêm thành công" });
            }
          }
         })
         .catch(function (err) {
            return res.status(500).send({ status: "ERROR", message: err.response.data});

         //console.log(err)
         //return console.log("\n"+JSON.stringify(err.response.data));
         //return Response.SendMessaageRes(res.status(err.response.status), JSON.stringify(err.response.data))
         })
  }

});

router.get("/", async function (req, res) {
  const { user_id } = req.tokenPayload;

  try {
    const list = await ListReceiver.find({ user_id: user_id });
    return res.status(200).send(list);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

/* trong body gửi lên có  receiver_account_number và remind_name
   chỉ edit được trường remind_name 
*/
router.post("/edit", async function (req, res) {
  const { user_id } = req.tokenPayload;
  try {
    await ListReceiver.findOneAndUpdate(
      {
        user_id: user_id,
        receiver_account_number: req.body.receiver_account_number,
      },
      {
        remind_name: req.body.remind_name,
      }
    );

    return res.status(200).send({ message: "ok" });
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

/* 
   trong body gửi lên có receiver_account_number và remind_name
*/
router.post("/delete", async function (req, res) {
  const { user_id } = req.tokenPayload;

  try {
    await ListReceiver.findOneAndDelete({
      user_id: user_id,
      receiver_account_number: req.body.receiver_account_number,
    });
    return res.status(200).send({ message: "đã xóa" });
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

module.exports = router;
