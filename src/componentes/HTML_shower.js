function HTML_shower({webContent}){
    return(
        <div className="div_web">
          <div className="div_org" dangerouslySetInnerHTML={{ __html: webContent}}></div>
        </div>
      );
}
export default HTML_shower;