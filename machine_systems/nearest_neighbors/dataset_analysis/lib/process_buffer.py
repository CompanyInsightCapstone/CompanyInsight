import multiprocessing as mp
import time
import pickle
from typing import Any, Dict, Optional
#https://stackoverflow.com/questions/8463008/multiprocessing-pipe-vs-queue/77842264#77842264
#https://stackoverflow.com/questions/8463008/multiprocessing-pipe-vs-queue/8463046#8463046
# https://docs.python.org/3/library/multiprocessing.html
# https://superfastpython.com/multiprocessing-pipe-in-python/

class ProcessBuffer:

    def __init__(self, manager: Optional[mp.Manager] = None):
        self._manager = manager or mp.Manager()
        self.recv_pipe, self.send_pipe = mp.Pipe(duplex=False)
        self.lock = self._manager.Lock()
        self.done_flag = self._manager.Value("b", False)
        self.peek_buffer = self._manager.list()
        self._cache_lock = self._manager.Lock()
        self._has_data_cache = self._manager.Value("b", False)
        self._last_check_time = self._manager.Value("d", 0.0)
        self._cache_ttl = 0.05

    def add(self, item: Any) -> bool:
        try:
            pickled_item = pickle.dumps(item)
            with self.lock:
                self.send_pipe.send_bytes(pickled_item)
                with self._cache_lock:
                    self._has_data_cache.value = True
                    self._last_check_time.value = time.time()
                return True
        except Exception as e:
            return False

    def get(self, timeout: float = 0.1) -> Optional[Any]:
        with self.lock:
            if len(self.peek_buffer) > 0:
                return self.peek_buffer.pop(0)
        if self.recv_pipe.poll(timeout):
            try:
                return pickle.loads(self.recv_pipe.recv_bytes())
            except Exception as e:
                return None
        return None

    def mark_done(self) -> None:
        self.done_flag.value = True

    def is_done(self) -> bool:
        return self.done_flag.value

    def empty(self) -> bool:
        with self._cache_lock:
            if self._has_data_cache.value and (time.time() - self._last_check_time.value) < self._cache_ttl:
                return False

        with self.lock:
            if len(self.peek_buffer) > 0:
                return False
            if self.recv_pipe.poll(0.001):
                try:
                    pickled_item = self.recv_pipe.recv_bytes()
                    item = pickle.loads(pickled_item)
                    self.peek_buffer.append(item)
                    with self._cache_lock:
                        self._has_data_cache.value = True
                        self._last_check_time.value = time.time()
                    return False
                except Exception:
                    return False
            with self._cache_lock:
                self._has_data_cache.value = False
                self._last_check_time.value = time.time()
            return True
