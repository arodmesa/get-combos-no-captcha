//import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import {useState, useEffect} from 'react';
import HTML_shower from './componentes/HTML_shower';
import LogIn from './componentes/LogIn';
import GetCombos from './componentes/GetCombos';

function App() {
  const [webContent, setWebContent]= useState('');
  const [user, setUser]= useState('');
  const [password, setPassword]= useState('');
  const [captcha, setCaptcha]= useState('');
  const [urlCaptcha, setUrlCaptcha]= useState('');
  const [captchaKey, setCaptchaKey]= useState('');
  const [autenticado, setAutenticado]= useState(false);
  const [token, setToken]= useState('');
  const [provID, setProvID]= useState('');
  const [prov_select, setProvSelect]= useState('Cienfuegos');
  const [hayCombo, setHayCombo]= useState(false);
  const [idCombo, setIdCombo]= useState([]);
  const [comboName, setComboName]= useState('')
  const [busqueda_activa, setBusquedaActiva]= useState(false);
  const [myInterval, setMyInterval]= useState(0);
  const [codigo_resp, setCodResp] =useState('');
  const [color_panel, setColorPanel]= useState('blanco');

  let funcEstados={
    user: setUser,
    password: setPassword,
    captcha: setCaptcha,
    urlCaptcha: setUrlCaptcha
  }
  let provincias=[
    'Artemisa', 'La Habana', 'Mayabeque', 'Matanzas', 'Villa Clara',
    'Cienfuegos', 'Ciego de Avila', 'Camaguey', "Las Tunas", 'Granma',
    'Santiago de Cuba', 'Municipio Especial Isla de la Juventud', 'Pinar del Rio',
    'Sancti Spiritus', 'Holguin', 'Guantanamo'
  ]  
  const CancelToken= axios.CancelToken;
  const source= CancelToken.source();
  //// Funciones /////
  function getHtml(url) {
    axios.get(url).then(response => {
      //response.header("Access-Control-Allow-Origin", "*");
      //response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      const extractScriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gmi;
      let scriptsExtracted;
      let innerHtml = response.data;
      while(scriptsExtracted = extractScriptRegex.exec(response.data)) {
        innerHtml = innerHtml.replace(scriptsExtracted[0], '');
        window.eval(scriptsExtracted[1]);
      }
      setWebContent(innerHtml);
    }).catch(error => {
      setWebContent('<h1>Error</h1>');
    });
  }

  function changeDatos(event, name){
    funcEstados[name](event.target.value);
  }
  function cambiarProv(event){
    setProvSelect(event.target.value);
  }

  function getCaptcha(){
    setUrlCaptcha('');
    const config={
      headers:{
        'Accept': 'application/json, text/plain, */*',
        'X-Requested-With': 'XMLHttpRequest',
      }
    }
    axios.get('captcha/refresh/', config)
    .then(res=> {
      setCaptchaKey(res.data.key);
      setUrlCaptcha(res.data.image_url);
    })
    .catch(err=> console.log(err))
  }
  function logUserIn(){
    const config = {
      headers:{
        "Content-Type": "application/json",
      }
    };
    const data = [
      {
          "operationName": "TokenAuth",
          "variables": {
              "captchaKey": captchaKey,
              "captchaValue": captcha,
              "email": user,
              "password": password
          },
          "query": "fragment Address on Address {\n  id\n  firstName\n  lastName\n  carnetIdentidad\n  andariegoKwt\n  phone\n  phonePayment\n  isDefaultBillingAddress\n  isDefaultShippingAddress\n  __typename\n}\n\nfragment User on User {\n  id\n  email\n  firstName\n  lastName\n  isStaff\n  defaultShippingAddress {\n    ...Address\n    __typename\n  }\n  defaultBillingAddress {\n    ...Address\n    __typename\n  }\n  addresses {\n    ...Address\n    __typename\n  }\n  avatar {\n    alt\n    url\n    __typename\n  }\n  __typename\n}\n\nmutation TokenAuth($email: String!, $password: String!, $captchaKey: String!, $captchaValue: String!) {\n  tokenCreate(email: $email, password: $password, captchaKey: $captchaKey, captchaValue: $captchaValue) {\n    token\n    errors {\n      field\n      message\n      __typename\n    }\n    user {\n      ...User\n      __typename\n    }\n    __typename\n  }\n}\n"
      },
      {
          "operationName": "GetShop",
          "variables": {},
          "query": "query GetShop {\n  shop {\n    displayGrossPrices\n    defaultCountry {\n      code\n      country\n      __typename\n    }\n    countries {\n      country\n      code\n      __typename\n    }\n    geolocalization {\n      country {\n        code\n        country\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n"
      },
      {
          "operationName": "Provinces",
          "variables": {},
          "query": "query Provinces {\n  provinces {\n    id\n    name\n    __typename\n  }\n}\n"
      }
    ]
    axios.post('graphql/', data, config)
    .then(res => {
      if (res.data[0].data.tokenCreate.token){
        setToken(res.data[0].data.tokenCreate.token);
        setProvID(res.data[2].data.provinces.filter(prov => prov.name===prov_select)[0].id)// id de la provincia seleccionada
        console.log(res.data[2].data.provinces.filter(prov => prov.name===prov_select)[0].id);
        setAutenticado(true);
        alert('Loggeado con exito')
      }else{
        alert(res.data[0].data.tokenCreate.errors[0].message);
        getCaptcha();
      }      
    })
    .catch(err => console.log(err))
  }

  function startLooking(bool_var){
    if (bool_var===busqueda_activa){
      return;
    }
    setBusquedaActiva(bool_var);
    if (bool_var){
      let miliseg=800;
      let temp_interval = setInterval(postCombo, miliseg);
      setMyInterval(temp_interval);
      localStorage.setItem('interval',temp_interval);
    }else{
      clearInterval(myInterval);
    }    
  }
  function postCombo(){
    const config = {
      cancelToken: source.token,
      headers:{
        "Content-Type": "application/json",
        "Authorization": `JWT ${token}`
      }
    };
    const data= [
      {
          "operationName": "Category",
          "variables": {
              "attributes": {},
              "isPublished": true,
              "pageSize": 6,
              "priceGte": null,
              "priceLte": null,
              "sortBy": null,
              "stockAvailability": "IN_STOCK",
              "currency": "CUP",
              "id": "Q2F0ZWdvcnk6NQ==",
              "province": provID
          },
          "query": "fragment BasicProductFields on Product {\n  id\n  name\n  thumbnail {\n    url\n    alt\n    __typename\n  }\n  thumbnail2x: thumbnail(size: 510) {\n    url\n    __typename\n  }\n  warehousePrefix\n  __typename\n}\n\nfragment Price on TaxedMoney {\n  gross {\n    amount\n    currency\n    __typename\n  }\n  net {\n    amount\n    currency\n    __typename\n  }\n  __typename\n}\n\nfragment ProductPricingField on Product {\n  pricing {\n    onSale\n    priceRangeUndiscounted {\n      start {\n        ...Price\n        __typename\n      }\n      stop {\n        ...Price\n        __typename\n      }\n      __typename\n    }\n    priceRange {\n      start {\n        ...Price\n        __typename\n      }\n      stop {\n        ...Price\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nquery Category($id: ID!, $attributes: [AttributeInput], $after: String, $pageSize: Int, $sortBy: ProductOrder, $priceLte: Float, $priceGte: Float, $stockAvailability: StockAvailability, $currency: CurrenciesForBuyEnum, $province: ID, $isPublished: Boolean) {\n  products(after: $after, first: $pageSize, sortBy: $sortBy, currency: $currency, province: $province, filter: {isPublished: $isPublished, attributes: $attributes, categories: [$id], minimalPrice: {gte: $priceGte, lte: $priceLte}, stockAvailability: $stockAvailability}) {\n    totalCount\n    edges {\n      node {\n        variants {\n          id\n          name\n          stockQuantity\n          canBuyProduct\n          __typename\n        }\n        restrictedAmount\n        ...BasicProductFields\n        ...ProductPricingField\n        category {\n          id\n          name\n          __typename\n        }\n        isAvailable\n        isShippingRequired\n        __typename\n      }\n      __typename\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      __typename\n    }\n    __typename\n  }\n  category(id: $id) {\n    seoDescription\n    seoTitle\n    id\n    name\n    backgroundImage {\n      url\n      __typename\n    }\n    ancestors(last: 5) {\n      edges {\n        node {\n          id\n          name\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  attributes(filter: {inCategory: $id}, first: 100) {\n    edges {\n      node {\n        id\n        name\n        slug\n        values {\n          id\n          name\n          "+
                   "slug\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n"
      }
    ]
    console.log('Busqueda !!!!!!')
    axios.post('graphql/', data, config)
    .then(res => {
      if (res.data[0].data.products.totalCount>0){
        setHayCombo(true);
        let temp_combos=res.data[0].data.products.edges.map((elem)=>{
          return elem.node.id;
        }); //puede que sea otro id en res.data[0].data.products.edges[0].node.variants[0].id  

        ////let temp_combos=['hisdfhkjdsghjfkhdjkfhs'];
        ////setIdCombo(temp_combos); 
        ////setComboName('prueba combo');   

        setComboName(res.data[0].data.products.edges[0].node.name);
        clearInterval((myInterval)?myInterval:localStorage.getItem('interval'));
        source.cancel();
        getInCart(temp_combos);        
      }else{
        respuesta(res.status);
      }   
    })
    .catch(err => console.log(err))
  }
  function respuesta(codigo){
    setTimeout(()=>{
      setColorPanel('blanco');
      setCodResp('');
    },1000)
    setColorPanel((codigo===200)?'verde':'rojo');
    setCodResp(codigo);
  }
  function getInCart(temp_combos){
    let miliseg=200;
    let temp_interval = setInterval(()=>{
      console.log('Peticion!!!!!!')
      const config = {
        headers:{
          "Content-Type": "application/json",
          "Authorization": `JWT ${token}`
        }
      };
      const data= temp_combos.map((elem)=>{
        return(
          [
            {
                "operationName": "cartReservationProduct",
                "variables": {
                    "input": {
                        "id": elem,
                        "reservationQuantity": 1
                    }
                },
                "query": "fragment Price on TaxedMoney {\n  gross {\n    amount\n    currency\n    __typename\n  }\n  net {\n    amount\n    currency\n    __typename\n  }\n  __typename\n}\n\nfragment ProductVariantFields on ProductVariant {\n  id\n  sku\n  name\n  stockQuantity\n  isAvailable\n  pricing {\n    onSale\n    priceUndiscounted {\n      ...Price\n      __typename\n    }\n    price {\n      ...Price\n      __typename\n    }\n    __typename\n  }\n  attributes {\n    attribute {\n      id\n      name\n      __typename\n    }\n    values {\n      id\n      name\n      value: name\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nmutation cartReservationProduct($input: ProductReservationCartInput!) {\n  productReservationCart(input: $input) {\n    reservation\n    id\n    availableMethodForTheReservation {\n      customType\n      id\n      name\n      price {\n        amount\n        currency\n        __typename\n      }\n      __typename\n    }\n    product {\n      id\n      name\n      variants {\n        ...ProductVariantFields\n        canBuyProduct\n        __typename\n      }\n      isAvailable\n      restrictedAmount\n      isPublished\n      restrictedAmount\n      updatedAt\n      __typename\n    }\n    errors {\n      field\n      message\n      __typename\n    }\n    productErrors {\n      field\n      message\n      code\n      __typename\n    }\n    __typename\n  }\n}\n"
            }
          ]
        )        
      })
      for (let i=0; i<data.length; i++){
        axios.post('graphql/', data[i], config)
        .then(res => {
         if(res.data[0].data.productReservationCart.reservation){
          alert('Producto agregado!!! Se detiene el agregado automático');
          clearInterval((myInterval)?myInterval:localStorage.getItem('interval'));
         }
         else{
          alert("Aparentemente el producto no ha podido ser agregado");
         }
        })
        .catch(err => 
          console.log(err)
        )
      }   
    }, miliseg);   
    setMyInterval(temp_interval);
    localStorage.setItem('interval',temp_interval);
  }
  function detenerGetInCart(){
    clearInterval((myInterval)?myInterval:localStorage.getItem('interval'));
  }

  useEffect(()=>{
    //getHtml('https://tienda.tuenvio.cu/login/');
    getCaptcha();
  },[])  
  /////////////////////
  return (
    <div className="App">
      <h1 className='title_app'>Cogedor de combos 1.0</h1>
      { (autenticado)?
        <>
          <GetCombos hayCombo={hayCombo} busqueda_activa={busqueda_activa} startLooking={startLooking} comboName={comboName} detenerGetInCart={detenerGetInCart} />
          <div className={`panel_notif ${color_panel}`}>
            <h1 className={'cod'}>{codigo_resp}</h1>
          </div>
        </>
       :
       <LogIn 
          provincias={provincias} user={user} password={password} captcha={captcha} 
          urlCaptcha={urlCaptcha} getCaptcha={getCaptcha} changeDatos={changeDatos} logUserIn={logUserIn} 
          prov_select={prov_select} cambiarProv={cambiarProv} 
        />        
      }
    </div>
  );
}

export default App;
