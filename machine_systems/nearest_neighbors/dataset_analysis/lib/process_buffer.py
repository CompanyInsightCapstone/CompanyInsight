import multiprocessing as mp
import time
from typing import Any, List, Optional
from concurrent.futures import Future

class ProcessBuffer:
    def __init__(self):
        self._manager = mp.Manager()
        self.queue = mp.Queue(maxsize=10000)
        self.done_flag = self._manager.Value("b", False)
        self.futures = []

    def add(self, item: Any) -> bool:
        try:
            self.queue.put(item, block=True, timeout=1.0)
            return True
        except Exception as e:
            print(f"Error adding item to buffer: {e}")
            return False

    def add_future(self, future: Future) -> None:
        self.futures.append(future)

    def get(self, timeout: float = 0.1) -> Optional[Any]:
        try:
            return self.queue.get(block=True, timeout=timeout)
        except Exception:
            return None

    def mark_done(self) -> None:
        self.done_flag.value = True

    def is_done(self) -> bool:
        all_futures_done = all(future.done() for future in self.futures) if self.futures else True
        return self.done_flag.value and all_futures_done

    def empty(self) -> bool:
        return self.queue.empty()
