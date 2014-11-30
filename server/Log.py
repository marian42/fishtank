import MySQLdb
import time
import sys
import traceback
from thread import *

from pushbullet import *
import FishTank

class Log(object):
	def __init__(self):
		Log.instance = self
		self.loglevels = ['log','info','event','warning','error','permanenterror']
		self.apiKey = "v1xhSH6ttgfNwBvwtbWcOqCcsrd0JvBaCyujBKHyJ8XxA"
		self.minPushLevel = 100 #2	
		
		self.pushbullet = PushBullet(self.apiKey)
		devices = self.pushbullet.getDevices()
		self.device = devices[0]
		self.last = {}
		
	def connectToDB(self):
		return MySQLdb.connect("localhost", "fishtank", "raspberry", "fishtank")
	
	def getRecentEntries(self, count = -1):		
		loglines = None
		db = self.connectToDB()
		try:
			curs = db.cursor()
			curs.execute ("SELECT * FROM log ORDER BY time DESC" + (" LIMIT " + str(count) if count != -1 else ""))
			db.close()
			loglines = list(curs.fetchall())
		except:
			print traceback.format_exc()
			return self.last
		
		for i in range(len(loglines)):
			loglines[i] = list(loglines[i])
			loglines[i][1] = time.mktime(loglines[i][1].timetuple())
			
		self.last = loglines
		
		return loglines
		
	def write(self, message, level = 0, image = 0, startedby = 'server', title = None):
		db = self.connectToDB()
		try:
			curs = db.cursor()
			curs.execute("INSERT INTO log (time, message, level, image, startedby) values (NOW(), '" + message + "', " + str(level) + ", " + str(image) + ", '" + startedby + "')")
			db.commit()
			db.close()
		except:
			print traceback.format_exc()
			#db.rollback()
			print "Error while writing to the database"
		if level >= self.minPushLevel:
			if (image == 0):
				start_new_thread(self.pushbullet.pushNote,(self.device['iden'],title if title != None else 'Fishtank (' + self.loglevels[level] + ')',message,))
			else:
				start_new_thread(self.pushbullet.pushFile,(self.device['iden'],title if title != None else 'Fishtank (' + self.loglevels[level] + ')', message, open(FishTank.FishTank.instance.camera.getPictureFilename(image), "rb"),));
		FishTank.FishTank.instance.increaseVersion()
		FishTank.FishTank.instance.save()