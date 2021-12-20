/** Connect to Moralis server */
const serverUrl = "https://pcnmagsrxw6a.usemoralis.com:2053/server"; //Server url from moralis.io
const appId = "GYGePgEvetMgQtvW2FJrK93yguMCIFECys5mqoe0"; // Application id from moralis.io
const CONTRACT_ADDRESS = "0xD7d3606c7351F9237C4faAc74F854153dBcE1113";

Moralis.start({ serverUrl, appId });

/** Add from here down */

async function loginMetamask() {
  let user = Moralis.User.current();
  console.log(user);
  if (user == null) {
    
      user = await Moralis.authenticate()
      console.log(user)
      console.log(user.get('ethAddress'))
      checkUser();
   
  }
}

/** Add from here down */
async function loginWalletConnect() {
  let user = Moralis.User.current();
  if (user == null) {
    const authOptions = {
      provider: "walletconnect",
      signingMessage: "Hello World!",
      chainId: 56,
    };
    user = await Moralis.authenticate(authOptions)
      .then(function (user) {
        console.log("logged in user:", user);
        console.log(user.get("ethAddress"));
        checkUser();
      })
      .catch(function (error) {
        console.log(error);
      });
  }
}

async function logOut() {
  await Moralis.User.logOut();
  console.log("logged out");
  checkUser();
}


function fetchNFTMetadata(NFTs){

  let promises = [];
  for(let i = 0; i < NFTs.length; i++){
    let nft = NFTs[i];
    let id = nft.token_id;

    //call Moralis Cloud function
    promises.push(fetch("https://pcnmagsrxw6a.usemoralis.com:2053/server/functions/getNFT?_ApplicationId=GYGePgEvetMgQtvW2FJrK93yguMCIFECys5mqoe0&nftId="+id)
        .then(res => res.json())
        .then(res => JSON.parse(res.result))
        .then(res => { nft.metadata = res })
        .then(res => {
          const options = { address: CONTRACT_ADDRESS, token_id: id, chain: "rinkeby" };
          console.log()
          return Moralis.Web3API.token.getTokenIdOwners(options)
        })
        .then( (res) => { 
          
          nft.owners = [];
          res.result.forEach(element => {
            nft.owners.push(element.ownerOf)
          })
          
          return nft;
        
        }));
  }

  return Promise.all(promises);

}


printNFTs = async () => {

    const options = { address: CONTRACT_ADDRESS, chain :"rinkeby" };
    let NFTs = await Moralis.Web3API.token.getAllTokenIds(options);
    let NDTWithMetadata = await fetchNFTMetadata(NFTs.result);
    $('#spinner-loading').hide();

    for(let i = 0; i < NDTWithMetadata.length; i++)
    {
      console.log(NDTWithMetadata[i]);
      const nft = NDTWithMetadata[i];
      nft_cloned = $('.nft-example').clone();
      nft_cloned.removeClass("nft-example");
      nft_cloned.find('.nft-img').attr('src', nft.metadata.image);
      nft_cloned.find('.nft-name').text(nft.metadata.name);
      nft_cloned.find('.nft-description').text(nft.metadata.description);
      nft_cloned.find('.nft-tokens').text(nft.amount)
      nft_cloned.find('.nft-owners').text(nft.owners.length)
      $('#div-nfts').append(nft_cloned);
      nft_cloned.show('fast');

    }

}


checkUser = async () => {
  if (await Moralis.User.current()) {
    $("#btn-logout").show();
    $("#btn-login").hide();
    
    if($('#loginModal').hasClass('show'))
    {
        $("#loginModal").modal('toggle');
    }
    BtnsLoginReset();

  } else {
    $("#btn-logout").hide();
    $("#btn-login").show();
  }
};

function BtnLoading(elem) {
  $(elem).attr("data-original-text", $(elem).html());
  $(elem).prop("disabled", true);
  $(elem).html('<i class="spinner-border spinner-border-sm"></i> Loading...');
}

function BtnReset(elem) {
  $(elem).prop("disabled", false);
  $(elem).html($(elem).attr("data-original-text"));
}

function BtnsLoginReset(){
  BtnReset($('#btnLoginMetamask'));
  BtnReset($('#btnLoginWalletConnect'));
}

$(document).ready(function() {


  //inicio 
  checkUser();
  printNFTs();


  //clicks
  $('#btnLoginMetamask').click(function(){
    var $this = $(this);
    BtnLoading($this);
    loginMetamask();
  });

  $('#btnLoginWalletConnect').click(function(){
    // var $this = $(this);
    // BtnLoading($this);
    loginWalletConnect();
  });

  $('#btn-logout').click(function(){
    var $this = $(this);
    BtnLoading($this);
    logOut();
  });


});


