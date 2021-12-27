/** Connect to Moralis server */
const serverUrl = "https://pcnmagsrxw6a.usemoralis.com:2053/server"; //Server url from moralis.io
const appId = "GYGePgEvetMgQtvW2FJrK93yguMCIFECys5mqoe0"; // Application id from moralis.io
const CONTRACT_ADDRESS = "0xD7d3606c7351F9237C4faAc74F854153dBcE1113";
const CONTRACT_ABI = '';
const currentUser = '';

Moralis.start({ serverUrl, appId });

/** Add from here down */

async function loginMetamask() {
  let user = Moralis.User.current();
  if (user == null) {
    
      user = await Moralis.authenticate()
      checkUser();
      printNFTs();
   
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
        checkUser();
        printNFTs();
      })
      .catch(function (error) {
        console.log(error);
      });
  }
}


signup = async (email, password) => {

  const user = new Moralis.User();
  user.set("username", email);
  user.set("password", password);
  user.set("email", email);

  try {
    await user.signUp();
    console.log('signup user');
    console.log(user);
    alert('Te enviamos email para verificar tu cuenta')
    checkUser();
  } catch (error) {
    $('#div-error-signin-signup').show();
    $('#error-signin-signup').text("Error: " + error.code + " " + error.message);
    return false;
  }

}


login = async (email, password) => {
  try {
    const user = await Moralis.User.logIn(email, password);
    checkUser();
  
  } catch (error) {
    
    $('#div-error-signin-signup').show();
    $('#error-signin-signup').text("Error: " + error.code + " " + error.message);
    return false;
  }

}



async function logOut() {
  await Moralis.User.logOut();
  console.log("logged out");
  checkUser();
  printNFTs();
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
            nft.owners.push(element.owner_of)
          })
          
          return nft;
        
        }));
  }

  return Promise.all(promises);

}

function getOwnerData(){

  let accounts = $('#user-account').text();
  console.log(accounts.trim());
  if(accounts.trim() == '')
  {
    return []; 
  }
  const options = { chain: "rinkeby", address: accounts, token_address: CONTRACT_ADDRESS };
  return Moralis.Web3API.account.getNFTsForContract(options).then((data) => {
    let result = data.result.reduce( (object, currentElement) => {
      object[currentElement.token_id] = currentElement.amount;
      return object;
    }, {})
    console.log(result);
    return result;
  });

}


printNFTs = async () => {
    $('#div-nfts').empty();
    $('#spinner-loading').show();
    const options = { address: CONTRACT_ADDRESS, chain :"rinkeby" };
    let NFTs = await Moralis.Web3API.token.getAllTokenIds(options);
    let ownerData = [];
    
    let check = await checkUser();
    if(check)
    {
      ownerData = await getOwnerData();
    }
    
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
      nft_cloned.find('.nft-btn-mint').data('id', nft.token_id)
      nft_cloned.find('.nft-btn-transfer').data('id', nft.token_id)
      nft_cloned.find('.nft-tokens').text(nft.amount)
      nft_cloned.find('.nft-owners').text(nft.owners.length)
      if(Object.keys(ownerData).length > 0)
      {
        nft_cloned.find('.nft-your-balance').text(ownerData[nft.token_id])
      }
      else
      {
        nft_cloned.find('.nft-your-balance').text(0)
      }
      $('#div-nfts').append(nft_cloned);
      nft_cloned.show('fast');

    }

}

async function mint() {
  let token_id = $('#mint_token_id').val(); 
  let amount = $('#mint_amount').val();
  let address = $('#mint_address').val();

  const contract = new web3.eth.Contract("", CONTRACT_ADDRESS);
  contract.methods.mint(address, token_id, amount).send({from: address, value:0})
  .on("receipt", function(receipt){
    alert('Mint done');
  });

}

async function transfer() {
  let token_id = $('#transfer_token_id').val(); 
  let amount = $('#transfer_amount').val();
  let address = $('#transfer_address').val();

  //cuenta 1: 0x9b26f31BA462818BE0405DC12fd374C482DE2A43
  //cuenta 2: 0xbd4693B2Af4F728F4A0Cf392b29E6D837B264810
  
  const options = {type: "erc1155",  
  receiver: address,
  contractAddress: CONTRACT_ADDRESS,
  tokenId: token_id,
  amount: amount}
  console.log(options);
  let result = await Moralis.transfer(options)
  
  result.on("receipt", function(receipt){
    alert('Transfer done');
  });
  
}

checkUser = async () => {
  user = await Moralis.User.current();
  if (user) {
    $("#btn-logout").show();
    $("#btn-login").hide();
    
    if($('#loginModal').hasClass('show'))
    {
        $("#loginModal").modal('toggle');
    }

    $('#nav-user').show();
    $('#user-account').text(user.get('ethAddress'));

    BtnsLoginReset();
    return true;

  } else {
    $('#nav-user').hide();
    $("#btn-logout").hide();
    $("#btn-login").show();

    return false;
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
  BtnReset($('#btn-logout'));
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

  $('#btn-show-signup').click(function(){
    //cambiar texto
    

    //cambiar boton
    $('#btn-signin').hide();
    $('#btn-signup').show();

    $('#btn-show-signin').show();
    $('#btn-show-signup').hide();

    $('#texto-signin-signup').hide();

    $('#btn-olvide-contrasena').show();

    $('#btn-olvide-contrasena').hide();
    //mostrar iniciar sesión
  });

  $('#btn-show-signin').click(function(){
    //cambiar texto
    $('#texto-signin-signup').show();

    //cambiar boton
    $('#btn-signin').show();
    $('#btn-signup').hide();

    $('#btn-show-signin').hide();
    $('#btn-show-signup').show();
    $('#div-contrasena').show();
    
    $('#btn-reset').hide();
    $('#btn-olvide-contrasena').show();
    

    //mostrar iniciar sesión
  });

  $('#btn-olvide-contrasena').click(function(){
    //esconder contraseña
    $('#div-contrasena').hide();

    //cambiar boton
    $('#btn-signin').hide();
    $('#btn-signup').hide();

    $('#btn-reset').show();

    $('#btn-show-signup').hide();
    $('#btn-show-signin').show();

    $('#btn-olvide-contrasena').hide();

  });

  $('#btn-signin').click(function(){

    let email = $('#email-signin-signup').val();
    let password = $('#password-signin-signup').val();

    login(email, password);
    
    //checkUser();
    

  });

  $('#btn-signup').click(function(){
    let email = $('#email-signin-signup').val();
    let password = $('#password-signin-signup').val();
    signup(email, password);


    //checkUser();
    

  });

  $('#btn-reset').click(function(){

      let email = $('#email-signin-signup').val();
      Moralis.User.requestPasswordReset(email)
      .then(() => {
        // Password reset request was sent successfully
        alert('Te enviamos un email para resetear tu contraseña')
      }).catch((error) => {
        // Show the error message somewhere
        alert("Error: " + error.code + " " + error.message);
      });

  });


  $(document).on('click', '.nft-btn-mint', function() {

    let token_id = $(this).data('id');
    
    $('#mintModal').find('#mint_token_id').val(token_id);
    $('#mintModal').find('#mint_address').val($('#user-account').text());
    $('#mintModal').modal('show');

    
  });

  $(document).on('click', '.nft-btn-transfer', function() {

    let token_id = $(this).data('id');
    
    $('#transferModal').find('#transfer_token_id').val(token_id);
    $('#transferModal').modal('show');

    
  });

  $('#submit_mint').click(function(){

    mint();

  });

  $('#submit_transfer').click(function(){

    transfer();

  });

});


