from flask import Flask
app = Flask(__name__,static_folder='dist',static_url_path='/')
@app.errorhandler(404)
def notFound(err):
    return app.send_static_file('index.html')
@app.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r
if(__name__=="__main__"):
    app.run('::',2020,debug=True)