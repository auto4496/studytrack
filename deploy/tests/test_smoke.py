import unittest
from unittest.mock import call, patch
from urllib.error import URLError

from deploy import smoke_test


class SmokeTests(unittest.TestCase):
    base = "https://studytrack.example.test"
    health = b'{"data":{"status":"ok","service":"StudyTrack API"}}'
    ui = b'<html><title>StudyTrack</title><div id="root"></div></html>'

    def test_checks_health_and_ui_after_retrying_connection(self):
        with (
            patch.object(
                smoke_test, "read", side_effect=[URLError("starting"), self.health, self.ui]
            ) as read,
            patch.object(smoke_test.time, "sleep") as sleep,
        ):
            smoke_test.check(self.base + "/")
        health_url = self.base + "/api/health"
        self.assertEqual(read.call_args_list, [call(health_url), call(health_url), call(self.base + "/")])
        sleep.assert_called_once_with(3)

    def test_rejects_unhealthy_database_even_if_endpoint_answers(self):
        with (
            patch.object(smoke_test, "read", return_value=b'{"data":{"status":"down"}}') as read,
            patch.object(smoke_test.time, "sleep"),
        ):
            with self.assertRaisesRegex(RuntimeError, r" /api/health$"):
                smoke_test.check(self.base)
        self.assertEqual(read.call_args_list, [call(self.base + "/api/health")] * 5)

    def test_rejects_default_page_even_if_health_passes(self):
        with (
            patch.object(
                smoke_test, "read", side_effect=[self.health] + [b"<html>Default page</html>"] * 5
            ),
            patch.object(smoke_test.time, "sleep"),
        ):
            with self.assertRaisesRegex(RuntimeError, r" /$"):
                smoke_test.check(self.base)
