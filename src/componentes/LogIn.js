//import axios from 'axios';
import './style/logIn.css'
function LogIn({user, password, captcha, urlCaptcha, getCaptcha, changeDatos, logUserIn, provincias, prov_select, cambiarProv}){
    let opciones=provincias.map((elem, index)=>{
        return(
            <option key={`option ${index}`} value={elem}>{elem}</option>
        )
    })
    return(
        <div className='div_log'>
            <input className='inputs' placeholder='correo' type='text' name="user" value={user} onChange={(event)=>{changeDatos(event, 'user')}}></input>
            <input className='inputs' placeholder='contraseña' type='text' name="password" value={password} onChange={(event)=>{changeDatos(event, 'password')}}></input>
            <img className='img_captcha' src={urlCaptcha} alt='captcha'></img>
            <div className='div_fila'>
                <input className='inputs' placeholder='captcha' type='text' name="captcha" value={captcha} onChange={(event)=>{changeDatos(event, 'captcha')}}></input>
                <i className="fa fa-refresh" onClick={getCaptcha}></i>
            </div>           
            <select name="provincias" className="provincias" value={prov_select} onChange={cambiarProv}>
                {opciones}
            </select>
            <button className='btn' type="button" onClick={logUserIn}>Continuar</button> 
        </div>
    )
}
export default LogIn