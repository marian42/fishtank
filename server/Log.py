import MySQLdb
import time
import sys
import traceback
from thread import *

from pushbullet import PushBullet

import FishTank
import Camera

loglevels = ['log','info','event','warning','error','permanenterror']
apiKey = "v1xhSH6ttgfNwBvwtbWcOqCcsrd0JvBaCyujBKHyJ8XxA"
minPushLevel = 100 #2

pushbullet = PushBullet(apiKey)
devices = pushbullet.getDevices()
devices[0]
last = {}

def connectToDB():
	return MySQLdb.connect("localhost", "fishtank", "raspberry", "fishtank")

def getRecentEntries(count = -1, minlevel = 0, page = 1):
	global last

	loglines = None
	db = connectToDB()
	try:
		offset = max(0, count * (page - 1))
		cursor = db.cursor()
		cursor.execute ("SELECT * FROM log WHERE level >= " + str(minlevel) + " ORDER BY time DESC" + (" LIMIT " + str(count) if count != -1 else "") + " OFFSET " + str(offset))
		db.close()
		loglines = list(cursor.fetchall())
	except:
		print traceback.format_exc()
		return last

	for i in range(len(loglines)):
		loglines[i] = list(loglines[i])
		loglines[i][1] = time.mktime(loglines[i][1].timetuple())

	last = loglines
	return loglines

def write(message, level = 0, image = 0, startedby = 'server', title = None):
	db = connectToDB()
	try:
		cursor = db.cursor()
		cursor.execute("INSERT INTO log (time, message, level, image, startedby) values (NOW(), '" + message + "', " + str(level) + ", " + str(image) + ", '" + startedby + "')")
		db.commit()
		db.close()
	except:
		print traceback.format_exc()
		print "Error while writing to the database"
	if level >= minPushLevel:
		if (image == 0):
			start_new_thread(pushbullet.pushNote,(device['iden'],title if title != None else 'Fishtank (' + loglevels[level] + ')',message))
		else:
			start_new_thread(pushbullet.pushFile,(device['iden'],title if title != None else 'Fishtank (' + loglevels[level] + ')', message, open(Camera.getPictureFilename(image), "rb")));
	FishTank.increaseVersion()
	FishTank.save()