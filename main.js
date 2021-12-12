const serverUrl = "https://pcnmagsrxw6a.usemoralis.com:2053/server"; //Server url from moralis.io
const appId = "GYGePgEvetMgQtvW2FJrK93yguMCIFECys5mqoe0"; // Application id from moralis.io
Moralis.start({ serverUrl, appId });

async function login() {
  try {
    user = await Moralis.authenticate();
    checkUser();
  } catch (error) {
    console.log(error);
  }
}


const signInContainer = document.getElementById("sign_in_container");
const signedInContainer = document.getElementById("signed_in_container");

checkUser = async () => {
  if (await Moralis.User.current()) {
    signInContainer.style.display = "none";
    signedInContainer.style.display = "block";


    const options = { address:"0xD7d3606c7351F9237C4faAc74F854153dBcE1113", chain :"rinkeby" };
    let NFTs = await Moralis.Web3API.token.getAllTokenIds(options);
    console.log(NFTs);

  } else {
    signInContainer.style.display = "block";
    signedInContainer.style.display = "none";
  }
};

checkUser();