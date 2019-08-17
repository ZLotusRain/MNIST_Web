import tornado.web
import tornado.ioloop
import tornado.options
import tornado.httpserver
import tornado.websocket
import os
import tensorflow as tf
import cv2
import base64
import numpy as np
import sys
sys.path.append("ML/CNN") 
import mnist_cnn as mnist_inference
import mnist_train as mnist_train

users=set()  # initialize web users set 
msg = ""  # web message
MODEL_PATH = 'mnist_model'

''' define handler '''
class IndexHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("digitsDraw.html")

''' websocket process '''
class WebsocketHandler(tornado.websocket.WebSocketHandler):
    u_img = None  # handwriting digits
    def open(self):
        global users
        users.add(self)  # add online users
    def on_message(self, img):
        global users
        global msg

        ''' canvas return base64 data '''
        ''' base64 convert to png '''
        img = img[len("data:image/png;base64,")-1:]
        img = bytes(img, encoding="utf-8")
        img += b'='
        img_data = base64.b64decode(img)
        # save picture to look up for modification
        with open('data.png', 'wb') as f:
            f.write(img_data)
        f.close()
        
        # get handwriting image
        img_tmp = cv2.imread("data.png",0)

        # reverse colour to enhance accuracy
        rows = img_tmp.shape[0]
        cols = img_tmp.shape[1]
        for i in range(rows):
            for j in range(cols):
                img_tmp[i][j] = 255 - img_tmp[i][j]
        img_tmp = cv2.resize(img_tmp,(28,28),interpolation=cv2.INTER_CUBIC)
        
        self.u_img = np.reshape(img_tmp,(28,28,1)).astype(np.float32)  # reshape to feed NN 
     
      
        with tf.Graph().as_default() as g:
            #定义用于输入图片数据的张量占位符，输入样本的尺寸
            x = tf.placeholder(tf.float32, shape=[None,
                                        mnist_inference.IMAGE_SIZE,
                                        mnist_inference.IMAGE_SIZE,
                                        mnist_inference.NUM_CHANNEL], name='x-input')
         
            y = mnist_inference.inference(x,None,None)
            variable_averages = tf.train.ExponentialMovingAverage(mnist_train.MOVING_AVERAGE_DECAY)
            variables_to_restore = variable_averages.variables_to_restore()
            saver = tf.train.Saver(variables_to_restore)
            with tf.Session() as sess:    
                saver = tf.train.import_meta_graph('model/model-9999001.meta')  # restore model
                saver.restore(sess,tf.train.latest_checkpoint('model'))
                result = sess.run(y,feed_dict={x:[self.u_img]})
                print(tf.argmax(result,1).eval()[0])
                msg = str(tf.argmax(result,1).eval()[0])
        self.write_message(msg)

    def on_close(self):
        global users
        users.remove(self) # 用户关闭连接后从容器中移除用户

    def check_origin(self, origin):
        return True  # 允许WebSocket的跨域请求




        
def main():
    # define default port
    tornado.options.define("port", default = 8888, help = "run on the given port", type = int)

    # default application setting
    settings = dict(template_path = os.path.join(os.path.dirname(__file__), "templates"),
                    static_path = os.path.join(os.path.dirname(__file__), "statics") )
    # default url
    url = [(r'/',IndexHandler),
        (r'/Websocket',WebsocketHandler)]

    tornado.options.parse_command_line()
    # 创建一个应用对象
    app = tornado.web.Application(handlers=url,**settings)
    http_server = tornado.httpserver.HTTPServer(app)

    # 绑定一个监听端口
    http_server.listen(tornado.options.options.port)    

    # 启动web程序，开始监听端口的连接
    tornado.ioloop.IOLoop.current().start()


if __name__ == '__main__':
    main()
