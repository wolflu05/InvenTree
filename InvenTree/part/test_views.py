"""Unit tests for Part Views (see views.py)."""

from django.test import tag
from django.urls import reverse

from InvenTree.unit_test import InvenTreeTestCase

from .models import Part


class PartViewTestCase(InvenTreeTestCase):
    """Base class for unit testing the various Part views."""

    fixtures = ['category', 'part', 'bom', 'location', 'company', 'supplier_part']

    roles = 'all'
    superuser = True


@tag('cui')
class PartListTest(PartViewTestCase):
    """Unit tests for the PartList view."""

    def test_part_index(self):
        """Test that the PartIndex page returns successfully."""
        response = self.client.get(reverse('part-index'))
        self.assertEqual(response.status_code, 200)

        keys = response.context.keys()
        self.assertIn('csrf_token', keys)
        self.assertIn('parts', keys)
        self.assertIn('user', keys)


class PartDetailTest(PartViewTestCase):
    """Unit tests for the PartDetail view."""

    @tag('cui')
    def test_part_detail(self):
        """Test that we can retrieve a part detail page."""
        pk = 1

        response = self.client.get(reverse('part-detail', args=(pk,)))
        self.assertEqual(response.status_code, 200)

        part = Part.objects.get(pk=pk)

        keys = response.context.keys()

        self.assertIn('part', keys)
        self.assertIn('category', keys)

        self.assertEqual(response.context['part'].pk, pk)
        self.assertEqual(response.context['category'], part.category)

    @tag('cui')
    def test_part_detail_from_ipn(self):
        """Test that we can retrieve a part detail page from part IPN.

        Rules:
        - if no part with matching IPN -> return part index
        - if unique IPN match -> return part detail page
        - if multiple IPN matches -> return part index
        """
        ipn_test = 'PART-000000-AA'
        pk = 1

        def test_ipn_match(index_result=False, detail_result=False):
            """Helper function for matching IPN detail view."""
            index_redirect = False
            detail_redirect = False

            response = self.client.get(
                reverse('part-detail-from-ipn', args=(ipn_test,))
            )

            # Check for PartIndex redirect
            try:
                if response.url == '/part/':
                    index_redirect = True
            except AttributeError:
                pass

            # Check for PartDetail redirect
            try:
                if response.context['part'].pk == pk:
                    detail_redirect = True
            except TypeError:
                pass

            self.assertEqual(index_result, index_redirect)
            self.assertEqual(detail_result, detail_redirect)

        # Test no match
        test_ipn_match(index_result=True, detail_result=False)

        # Test unique match
        part = Part.objects.get(pk=pk)
        part.IPN = ipn_test
        part.save()

        test_ipn_match(index_result=False, detail_result=True)

        # Test multiple matches
        part = Part.objects.get(pk=pk + 1)
        part.IPN = ipn_test
        part.save()

        test_ipn_match(index_result=True, detail_result=False)

    def test_bom_download(self):
        """Test downloading a BOM for a valid part."""
        response = self.client.get(
            reverse('api-bom-download', args=(1,)),
            headers={'x-requested-with': 'XMLHttpRequest'},
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('streaming_content', dir(response))
